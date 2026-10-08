"use client";

import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  generatePostThumbnailAction,
  uploadThumbnailAction,
} from "@/server/actions/generate-thumbnail";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";

type Props = {
  postId: string;
  slug: string;
  initialThumbnailTitle?: string | null;
  initialCoverUrl?: string | null;
  onThumbnailGenerated?: (result: { url: string; mediaId: string }) => void;
};

// Studio de génération des miniatures Liquid Glass (Dark & Light Cobalt) dans l'admin.
// Affiche directement les rendus exacts Chromium Playwright pour garantir une fidélité 100% au pixel près.
export function PostThumbnailStudio({
  postId,
  slug,
  initialThumbnailTitle,
  initialCoverUrl,
  onThumbnailGenerated,
}: Props) {
  const [title, setTitle] = useState(
    initialThumbnailTitle || "Réfraction optique|*en verre liquide*",
  );
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(
    initialCoverUrl ?? null,
  );
  const [previewVersion, setPreviewVersion] = useState(Date.now());
  const [isPending, startTransition] = useTransition();
  const inputId = useId();

  // Use existing static thumbnail first, fallback to dynamic preview API
  const staticThumbUrl = slug
    ? `/thumbnails/${slug}-${previewTheme}.png?v=${previewVersion}`
    : null;
  const previewUrl =
    generatedUrl && previewTheme === "dark"
      ? generatedUrl
      : staticThumbUrl ||
        `/api/admin/journal/preview-thumbnail?title=${encodeURIComponent(title)}&theme=${previewTheme}&v=${previewVersion}`;

  // Toggle bold markdown syntax on selected text
  const toggleBold = () => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start === end) return;

    const val = input.value;
    const selected = val.slice(start, end);
    const isAlreadyBold = selected.startsWith("*") && selected.endsWith("*");

    let replacement: string;
    if (isAlreadyBold) {
      replacement = selected.slice(1, -1);
    } else {
      replacement = `*${selected}*`;
    }

    const next = val.slice(0, start) + replacement + val.slice(end);
    setTitle(next);
  };

  const refreshPreview = () => {
    setGeneratedUrl(null);
    setPreviewVersion(Date.now());
  };

  const darkInputRef = useRef<HTMLInputElement>(null);
  const lightInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (theme: "dark" | "light", file: File) => {
    if (!slug) {
      toast.error("Veuillez d'abord définir un slug pour l'article.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("postId", postId);
      fd.set("slug", slug);
      fd.set("theme", theme);
      fd.set("file", file);

      const res = await uploadThumbnailAction(fd);
      if (res.ok && res.url) {
        setGeneratedUrl(res.url);
        setPreviewVersion(Date.now());
        toast.success(
          `Miniature ${theme === "dark" ? "Dark" : "Light"} importée avec succès !`,
        );
        if (res.mediaId && onThumbnailGenerated) {
          onThumbnailGenerated({ url: res.url, mediaId: res.mediaId });
        }
      } else {
        toast.error(res.message ?? "Erreur lors de l'import.");
      }
    });
  };

  const handleGenerate = () => {
    if (!slug) {
      toast.error("Veuillez d'abord définir un slug pour l'article.");
      return;
    }

    startTransition(async () => {
      const res = await generatePostThumbnailAction({
        postId,
        slug,
        title,
      });

      if (res.ok && res.url) {
        setGeneratedUrl(res.url);
        toast.success(
          "Miniatures Liquid Glass (Dark & Light) générées à 100% et liées à l'article !",
        );
        if (res.mediaId && onThumbnailGenerated) {
          onThumbnailGenerated({ url: res.url, mediaId: res.mediaId });
        }
      } else {
        toast.error(res.message ?? "Erreur lors de la génération.");
      }
    });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Miniatures Liquid Glass (Dark & Light Cobalt)</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Rendu Réel Chromium 100% Fidèle
          </span>
        </CardTitle>
        <CardDescription>
          Moteur optique haute fidélité (fond verre cannelé avec relief, dalle
          de verre liquide biseautée, réfraction 3D, typographie Archivo
          Thin/Fat). Génère automatiquement les deux versions pour le thème
          sombre et le thème clair.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={inputId}
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              Titre spécifique de la miniature (indépendant du titre de
              l'article)
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleBold}
                className="h-7 text-xs font-semibold"
              >
                Mettre en gras (*)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refreshPreview}
                className="h-7 text-xs"
              >
                Actualiser l'aperçu
              </Button>
            </div>
          </div>
          <input
            id={inputId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                refreshPreview();
              }
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Ex: Réfraction optique|*en verre liquide*"
          />
        </div>

        {/* Sélecteur de thème pour l'aperçu */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs text-muted-foreground">
            Aperçu thématique en direct :
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setPreviewTheme("dark")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                previewTheme === "dark"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dark (#08090D)
            </button>
            <button
              type="button"
              onClick={() => setPreviewTheme("light")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                previewTheme === "light"
                  ? "bg-[#0029FF] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Light (Cobalt & Verre Cannelé)
            </button>
          </div>
        </div>

        {/* Aperçu Réel Haute Fidélité */}
        <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-2xl bg-[#08090d] border border-white/10 shadow-2xl flex items-center justify-center">
          {/* biome-ignore lint/performance/noImgElement: direct high fidelity preview */}
          <img
            key={previewUrl}
            src={previewUrl}
            alt="Aperçu exact Liquid Glass"
            className="w-full h-full object-contain"
            onError={(e) => {
              if (!e.currentTarget.src.includes("og-default.png")) {
                e.currentTarget.src = "/og-default.png";
              }
            }}
          />
        </div>

        {/* Boutons d'action : génération automatique */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="font-medium"
          >
            {isPending
              ? "Génération en cours (Dark & Light Cobalt via Chromium)…"
              : generatedUrl
                ? "Régénérer les 2 miniatures (Chromium Local)"
                : "Générer les 2 miniatures automatiquement (Chromium Local)"}
          </Button>

          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Ouvrir l'aperçu 1200×630 ↗
            </a>
          )}
        </div>

        {/* Import manuel direct (sans dépendance Chromium) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Ou importer vos miniatures directement
            </p>
            <p className="text-xs text-muted-foreground">
              Téléversez vos fichiers PNG ou WebP (1200×630) directement sans
              passer par Chromium.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={darkInputRef}
              type="file"
              accept="image/png,image/webp,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload("dark", f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => darkInputRef.current?.click()}
            >
              Importer Dark (#08090D)
            </Button>

            <input
              ref={lightInputRef}
              type="file"
              accept="image/png,image/webp,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload("light", f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => lightInputRef.current?.click()}
            >
              Importer Light (Cobalt)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
