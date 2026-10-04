"use client";

import { createId } from "@paralleldrive/cuid2";
import { uploadPresigned } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HEIC_MIME,
  IMAGE_MIME,
  INPUT_MIME,
  MAX_UPLOAD_BYTES,
  MULTIPART_THRESHOLD_BYTES,
  SVG_MIME,
  VIDEO_MIME,
} from "@/media/constants";
import { processImage } from "@/media/process-image";
import { processSvg } from "@/media/process-svg";
import { readVideo } from "@/media/process-video";
import { deleteMedia, registerMedia } from "@/server/actions/media";

type Item = { key: string; name: string; status: string; error?: boolean };
type Report = (status: string) => void;

const isImage = (t: string) =>
  [...IMAGE_MIME, ...HEIC_MIME].includes(t as (typeof IMAGE_MIME)[number]);
const isVideo = (t: string) => (VIDEO_MIME as readonly string[]).includes(t);

async function send(
  body: Blob,
  ext: string,
  contentType: string,
  report: Report,
) {
  return uploadPresigned(`media/${createId()}.${ext}`, body, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType,
    multipart: body.size > MULTIPART_THRESHOLD_BYTES,
    onUploadProgress: ({ percentage }) =>
      report(`Envoi… ${Math.round(percentage)} %`),
  });
}

async function uploadImage(
  file: File,
  report: Report,
  options: { opaque?: boolean } = {},
): Promise<{ id: string; label: string }> {
  report("Traitement (redimensionnement, ThumbHash)…");
  const img = await processImage(file, options);
  const blob = await send(img.file, img.ext, img.mimeType, report);
  report("Enregistrement…");
  const result = await registerMedia({
    kind: "image",
    pathname: blob.pathname,
    url: blob.url,
    mimeType: img.mimeType,
    fileSize: img.file.size,
    width: img.width,
    height: img.height,
    thumbhash: img.thumbhash,
    dominantColor: img.dominantColor,
    originalName: file.name,
    altFr: "",
    altEn: "",
  });
  if (!result.ok) throw new Error(result.message);
  return {
    id: result.data.id,
    label: `${img.width}×${img.height}, ${img.mimeType}`,
  };
}

async function uploadSvg(file: File, report: Report) {
  report("Nettoyage du SVG…");
  const svg = await processSvg(file);
  const blob = await send(svg.file, "svg", SVG_MIME, report);
  report("Enregistrement…");
  const result = await registerMedia({
    kind: "svg",
    pathname: blob.pathname,
    url: blob.url,
    mimeType: SVG_MIME,
    fileSize: svg.file.size,
    width: svg.width,
    height: svg.height,
    originalName: file.name,
    altFr: "",
    altEn: "",
  });
  if (!result.ok) throw new Error(result.message);
  return {
    id: result.data.id,
    label: `SVG nettoyé, ${svg.width}×${svg.height}`,
  };
}

async function uploadVideo(file: File, report: Report) {
  report("Lecture de la vidéo et extraction du poster…");
  const info = await readVideo(file);
  // Opaque video poster encoded to WebP/JPEG to minimize storage footprint.
  const poster = await uploadImage(
    info.poster,
    (s) => report(`Poster : ${s}`),
    { opaque: true },
  );
  try {
    return await sendVideo(file, info, poster.id, report);
  } catch (err) {
    // Clean up generated poster if video upload fails
    const data = new FormData();
    data.set("id", poster.id);
    await deleteMedia(null, data).catch(() => undefined);
    throw err;
  }
}

async function sendVideo(
  file: File,
  info: Awaited<ReturnType<typeof readVideo>>,
  posterId: string,
  report: Report,
) {
  const ext = file.type === "video/webm" ? "webm" : "mp4";
  const blob = await send(file, ext, file.type, (s) => report(`Vidéo : ${s}`));
  report("Enregistrement…");
  const result = await registerMedia({
    kind: "video",
    pathname: blob.pathname,
    url: blob.url,
    mimeType: file.type,
    fileSize: file.size,
    width: info.width,
    height: info.height,
    durationMs: info.durationMs,
    posterMediaId: posterId,
    originalName: file.name,
    altFr: "",
    altEn: "",
  });
  if (!result.ok) throw new Error(result.message);
  return {
    id: result.data.id,
    label: `vidéo ${info.width}×${info.height}, ${(info.durationMs / 1000).toFixed(1)} s, poster créé`,
  };
}

type UploaderProps = {
  /** Accepted MIME types (defaults to all supported media types). */
  accept?: readonly string[];
  /** Callback invoked with created media IDs (for auto-selection in pickers). */
  onUploaded?: (ids: string[]) => void;
  /** When compact, hides the section title for nested modal contexts. */
  compact?: boolean;
};

export function MediaUploader({
  accept = INPUT_MIME,
  onUploaded,
  compact = false,
}: UploaderProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);

  const update = (key: string, patch: Partial<Item>) =>
    setItems((list) =>
      list.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    );

  async function handleFile(file: File): Promise<string | null> {
    const key = createId();
    setItems((list) => [
      ...list,
      { key, name: file.name, status: "En attente…" },
    ]);
    const report: Report = (status) => update(key, { status });
    try {
      if (!accept.includes(file.type)) {
        throw new Error(`type non accepté ici (${file.type || "inconnu"})`);
      }
      if (file.size > MAX_UPLOAD_BYTES) throw new Error("fichier > 60 Mo");
      const done = isImage(file.type)
        ? await uploadImage(file, report)
        : isVideo(file.type)
          ? await uploadVideo(file, report)
          : await uploadSvg(file, report);
      update(key, {
        status: `Ajouté ✓ (${done.label}) — pense aux textes alternatifs`,
      });
      return done.id;
    } catch (err) {
      update(key, {
        status: `Échec : ${err instanceof Error ? err.message : "erreur inconnue"}`,
        error: true,
      });
      return null;
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    // Sequential uploads avoid memory exhaustion with multiple large assets.
    const ids: string[] = [];
    for (const file of Array.from(files)) {
      const id = await handleFile(file);
      if (id) ids.push(id);
    }
    router.refresh();
    if (ids.length) onUploaded?.(ids);
  }

  const types = [
    accept.some(isImage) && "images (JPEG, PNG, WebP, AVIF, HEIC avec Safari)",
    accept.includes(SVG_MIME) && "SVG",
    accept.some(isVideo) && "vidéos MP4/WebM",
  ].filter(Boolean);

  return (
    <section
      aria-labelledby={compact ? undefined : "upload-title"}
      aria-label={compact ? "Envoyer des fichiers" : undefined}
      className="grid gap-3"
    >
      {!compact && (
        <h2 id="upload-title" className="text-lg font-semibold">
          Ajouter des médias
        </h2>
      )}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop target complements accessible file button */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`grid place-items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-ring bg-accent" : "border-border"
        }`}
      >
        <p className="text-sm text-muted-foreground">
          Glisse des fichiers ici — {types.join(", ")} — 60 Mo max
        </p>
        <label className="inline-flex cursor-pointer items-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent focus-within:outline-2 focus-within:outline-ring">
          Choisir des fichiers
          <input
            type="file"
            accept={[
              ...accept,
              ...(accept.some(isImage) ? [".heic", ".heif"] : []),
            ].join(",")}
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.currentTarget.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {items.length > 0 && (
        <ul aria-live="polite" className="grid gap-1 text-sm">
          {items.map((i) => (
            <li
              key={i.key}
              role={i.error ? "alert" : undefined}
              className={i.error ? "text-destructive" : "text-muted-foreground"}
            >
              <span className="text-foreground">{i.name}</span> — {i.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
