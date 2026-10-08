import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MediaAltForm } from "@/components/admin/MediaAltForm";
import { MediaDeleteButton } from "@/components/admin/MediaDeleteButton";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { OrphanCleaner } from "@/components/admin/OrphanCleaner";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { listAdminMedia } from "@/server/admin/media";

// Media library: fetches real-time database rows on every request.
export const instant = false;

export const metadata: Metadata = { title: "Médiathèque" };

type Item = Awaited<ReturnType<typeof listAdminMedia>>[number];

// Media preview component: Next.js Image for raster images, native <img> for raw SVG, muted video player with poster.
function Preview({ m, posterUrl }: { m: Item; posterUrl?: string }) {
  const bg = { background: m.dominantColor ?? undefined };
  const box =
    "aspect-[4/3] w-full rounded-md border border-border object-cover";
  if (m.kind === "video") {
    return (
      <video
        src={m.url}
        poster={posterUrl}
        controls
        muted
        playsInline
        preload="none"
        className={box}
        style={bg}
      />
    );
  }
  if (m.kind === "svg") {
    return (
      // biome-ignore lint/performance/noImgElement: SVGs bypass Next.js image optimizer
      <img
        src={m.url}
        alt={m.altFr || ""}
        className={`${box} object-contain p-4`}
        style={bg}
      />
    );
  }
  return (
    <Image
      src={m.url}
      alt={m.altFr || ""}
      width={m.width}
      height={m.height}
      sizes="(min-width: 768px) 280px, 50vw"
      className={box}
      style={bg}
    />
  );
}

const KIND = { image: "Image", svg: "SVG", video: "Vidéo" } as const;

// Admin media library view: search, upload, and metadata management.
export default async function MediaLibraryPage({
  searchParams,
}: PageProps<"/admin/medias">) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const items = await listAdminMedia(search);
  const urlById = new Map(items.map((m) => [m.id, m.url]));
  const missingAlt = items.filter((m) => !m.altFr || !m.altEn).length;

  return (
    <main className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Médiathèque</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} média{items.length > 1 ? "s" : ""}
          {search && ` pour « ${search} »`}
          {missingAlt > 0 && ` · ${missingAlt} sans texte alternatif complet`}
        </p>
      </div>

      <MediaUploader />

      <search>
        <form className="flex max-w-lg gap-2">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Nom de fichier ou texte alternatif"
            aria-label="Rechercher un média"
          />
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
          {search && (
            <Button asChild variant="ghost">
              <Link href="/admin/medias">Effacer</Link>
            </Button>
          )}
        </form>
      </search>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Aucun média{search ? ` pour « ${search} »` : ""}.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <li
              key={m.id}
              className="grid content-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Preview
                m={m}
                posterUrl={
                  m.posterMediaId ? urlById.get(m.posterMediaId) : undefined
                }
              />
              <div className="grid gap-1">
                <p
                  className="truncate text-sm font-medium"
                  title={m.originalName ?? m.pathname}
                >
                  {m.originalName ?? m.pathname}
                </p>
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <Badge variant="outline">{KIND[m.kind]}</Badge>
                  <span>
                    {m.width}×{m.height}
                    {m.durationMs
                      ? ` · ${(m.durationMs / 1000).toFixed(1)} s`
                      : ""}{" "}
                    · {Math.round(m.fileSize / 1024)} Ko
                  </span>
                  {(!m.altFr || !m.altEn) && (
                    <Badge
                      variant="outline"
                      className="border-destructive/50 text-destructive"
                    >
                      alt manquant
                    </Badge>
                  )}
                </div>
                {m.usages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Non utilisé</p>
                ) : (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Utilisé {m.usages.length} fois
                    </summary>
                    <ul className="mt-1 grid gap-0.5 pl-3">
                      {m.usages.map((u) => (
                        <li key={`${u.where}-${u.projectId ?? ""}`}>
                          {u.where}
                          {u.projectId && (
                            <>
                              {" — "}
                              <Link
                                href={`/admin/projets/${u.projectId}`}
                                className="underline underline-offset-2"
                              >
                                {u.projectSlug}
                              </Link>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <MediaAltForm id={m.id} altFr={m.altFr} altEn={m.altEn} />
              <MediaDeleteButton
                id={m.id}
                name={m.originalName ?? m.pathname}
                used={m.usages.length > 0}
              />
            </li>
          ))}
        </ul>
      )}

      <OrphanCleaner />
    </main>
  );
}
