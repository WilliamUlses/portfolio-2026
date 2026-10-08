"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/admin/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Input } from "@/components/admin/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/tabs";
import { cn } from "@/lib/utils";
import { HEIC_MIME, IMAGE_MIME, SVG_MIME, VIDEO_MIME } from "@/media/constants";
import type { MediaOption } from "@/server/admin/media";
import { MediaUploader } from "./MediaUploader";

// Visual media picker dialog: thumbnail grid, search filtering, inline upload, single or ordered multi-selection.
type Kind = MediaOption["kind"];

type Props = {
  label: string;
  hint?: string;
  media: MediaOption[];
  kinds: Kind[];
  /** Minimum pixel width (e.g. cover >= 1200px); smaller assets are filtered out. */
  minWidth?: number;
  /** Hidden form field name for standard form submission. */
  name?: string;
  multiple?: boolean;
  max?: number;
  value: string[];
  onChange?: (ids: string[]) => void;
};

export function Thumb({
  m,
  className,
}: {
  m: MediaOption;
  className?: string;
}) {
  const style = { background: m.dominantColor ?? undefined };
  const src = m.kind === "video" ? m.posterUrl : m.url;
  if (!src) {
    return (
      <div
        className={cn(
          "grid place-items-center text-xs text-muted-foreground",
          className,
        )}
        style={style}
      >
        vidéo
      </div>
    );
  }
  if (m.kind === "svg") {
    return (
      // biome-ignore lint/performance/noImgElement: SVGs bypass Next.js image optimizer
      <img
        src={src}
        alt=""
        className={cn("object-contain p-2", className)}
        style={style}
      />
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={240}
      height={240}
      sizes="160px"
      className={cn("object-cover", className)}
      style={style}
    />
  );
}

function acceptFor(kinds: Kind[]): string[] {
  return [
    ...(kinds.includes("image") ? [...IMAGE_MIME, ...HEIC_MIME] : []),
    ...(kinds.includes("svg") ? [SVG_MIME] : []),
    ...(kinds.includes("video") ? [...VIDEO_MIME] : []),
  ];
}

export function MediaPicker({
  label,
  hint,
  media,
  kinds,
  minWidth,
  name,
  multiple = false,
  max,
  value,
  onChange,
}: Props) {
  const [selected, setSelected] = useState<string[]>(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("library");
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const eligible = useMemo(
    () =>
      media.filter(
        (m) =>
          kinds.includes(m.kind) &&
          (!minWidth || m.kind === "svg" || m.width >= minWidth),
      ),
    [media, kinds, minWidth],
  );
  const hidden =
    media.filter((m) => kinds.includes(m.kind)).length - eligible.length;
  const term = search.trim().toLowerCase();
  const shown = term
    ? eligible.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.altFr.toLowerCase().includes(term),
      )
    : eligible;
  const byId = new Map(media.map((m) => [m.id, m]));

  // Auto-select assets uploaded within modal once they appear in the media list.
  useEffect(() => {
    if (!pendingIds.length) return;
    const arrived = pendingIds.filter((id) => byId.has(id));
    if (!arrived.length) return;
    setDraft((d) =>
      multiple
        ? [...d, ...arrived.filter((id) => !d.includes(id))].slice(0, max)
        : [arrived[0] as string],
    );
    setPendingIds((p) => p.filter((id) => !arrived.includes(id)));
    setTab("library");
  }, [pendingIds, byId, multiple, max]);

  const commit = (ids: string[]) => {
    setSelected(ids);
    onChange?.(ids);
  };
  const toggle = (id: string) =>
    setDraft((d) => {
      if (!multiple) return [id];
      if (d.includes(id)) return d.filter((x) => x !== id);
      return max && d.length >= max ? d : [...d, id];
    });

  const chosen = selected
    .map((id) => byId.get(id))
    .filter((m): m is MediaOption => Boolean(m));

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">
        {label}
        {hint && (
          <span className="font-normal text-muted-foreground"> — {hint}</span>
        )}
      </span>
      {name && <input type="hidden" name={name} value={selected.join(",")} />}
      <div className="flex flex-wrap items-center gap-2">
        {chosen.map((m, i) => (
          <div
            key={m.id}
            className="relative size-20 overflow-hidden rounded-md border border-border"
            title={m.name}
          >
            <Thumb m={m} className="size-full" />
            {multiple && (
              <span className="absolute left-1 top-1 rounded bg-background/80 px-1 text-xs tabular-nums">
                {i + 1}
              </span>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft(selected);
            setSearch("");
            setTab("library");
            setOpen(true);
          }}
        >
          {chosen.length ? "Modifier…" : "Choisir…"}
        </Button>
        {chosen.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => commit([])}
          >
            Retirer
          </Button>
        )}
        {chosen.length === 1 && !multiple && (
          <span className="text-xs text-muted-foreground">
            {chosen[0]?.label}
          </span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              {multiple
                ? `Clique pour ajouter ou retirer — l'ordre de sélection est l'ordre d'affichage${max ? ` (${max} max)` : ""}.`
                : "Clique sur un média pour le choisir."}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="library">Médiathèque</TabsTrigger>
              <TabsTrigger value="upload">Envoyer</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-3 grid gap-3">
              <Input
                type="search"
                placeholder="Rechercher (nom ou texte alternatif)"
                aria-label="Rechercher un média"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {hidden > 0 && minWidth && (
                <p className="text-xs text-muted-foreground">
                  {hidden} média{hidden > 1 ? "s" : ""} masqué
                  {hidden > 1 ? "s" : ""} (moins de {minWidth} px de large).
                </p>
              )}
              {shown.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Aucun média{term ? ` pour « ${search} »` : ""}. Utilise
                  l'onglet « Envoyer ».
                </p>
              ) : (
                <ul className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-5">
                  {shown.map((m) => {
                    const position = draft.indexOf(m.id);
                    const active = position >= 0;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          aria-pressed={active}
                          aria-label={`${m.name}${m.altFr ? ` — ${m.altFr}` : ""}`}
                          onClick={() => toggle(m.id)}
                          onDoubleClick={() => {
                            if (!multiple) {
                              commit([m.id]);
                              setOpen(false);
                            }
                          }}
                          className={cn(
                            "group relative block aspect-square w-full overflow-hidden rounded-md border-2 transition",
                            active
                              ? "border-ring"
                              : "border-transparent hover:border-border",
                          )}
                        >
                          <Thumb m={m} className="size-full" />
                          {active && (
                            <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                              {multiple ? position + 1 : "✓"}
                            </span>
                          )}
                          <span className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1.5 py-0.5 text-left text-[11px] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                            {m.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="upload" className="mt-3">
              <MediaUploader
                compact
                accept={acceptFor(kinds)}
                onUploaded={(ids) => setPendingIds((p) => [...p, ...ids])}
              />
            </TabsContent>
          </Tabs>
          <DialogFooter className="items-center">
            <span className="mr-auto text-sm text-muted-foreground">
              {draft.length} sélectionné{draft.length > 1 ? "s" : ""}
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                commit(draft);
                setOpen(false);
              }}
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
