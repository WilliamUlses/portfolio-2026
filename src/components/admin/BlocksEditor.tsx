"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createId } from "@paralleldrive/cuid2";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/alert-dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/admin/ui/native-select";
import { Textarea } from "@/components/admin/ui/textarea";
import type { Block, BlockType } from "@/content/blocks";
import { copyStructure } from "@/content/copy-structure";
import type { ActionResult } from "@/content/project-input";
import { readablePath } from "@/content/zod-fr";
import { cn } from "@/lib/utils";
import { updateBlocks } from "@/server/actions/blocks";
import type { MediaOption } from "@/server/admin/media";
import { MediaPicker } from "./MediaPicker";
import { RichTextEditor } from "./RichTextEditor";

// Case study block editor: support for all content block types, drag-and-drop or button reordering,
// rich text editing (Tiptap), FR -> EN structure cloning, and media pickers.

// Sortable block wrapper: drag listeners are scoped to the handle icon so internal form controls remain interactive.
function SortableItem({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const handle = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      {...attributes}
      {...listeners}
      aria-label={`Déplacer : ${label} (Espace puis flèches)`}
      className="cursor-grab"
    >
      ⠿
    </Button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 opacity-70")}
    >
      {children(handle)}
    </li>
  );
}

const TYPE_LABELS: Record<BlockType, string> = {
  text: "Texte",
  image: "Image",
  gallery: "Galerie",
  video: "Vidéo",
  quote: "Citation",
  stats: "Chiffres clés",
  credits: "Crédits",
  embed: "Intégration (Vimeo, YouTube, Figma)",
};

// Instantiates default block structures for new content blocks
function newBlock(type: BlockType): Block {
  const id = createId();
  switch (type) {
    case "text":
      return { id, type, doc: { type: "doc", content: [] }, width: "narrow" };
    case "image":
      return { id, type, mediaId: "", layout: "full" };
    case "gallery":
      return { id, type, mediaIds: [], columns: 2 };
    case "video":
      return { id, type, mediaId: "", autoplayLoop: true };
    case "quote":
      return { id, type, text: "" };
    case "stats":
      return { id, type, items: [{ value: "", label: "" }] };
    case "credits":
      return { id, type, items: [{ role: "", name: "" }] };
    case "embed":
      return { id, type, provider: "vimeo", url: "" };
  }
}

type Props = {
  projectId: string;
  locale: "fr" | "en";
  initial: Block[];
  media: MediaOption[];
  disabledReason?: string;
  /** Alternate locale blocks source used for structure cloning. */
  copyFrom?: { label: string; blocks: Block[] };
};

export function BlocksEditor({
  projectId,
  locale,
  initial,
  media,
  disabledReason,
  copyFrom,
}: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  // Latest block state ref read on save to avoid race conditions with keystroke re-renders
  const latest = useRef<Block[]>(initial);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [newType, setNewType] = useState<BlockType>("text");
  const p = `blocks-${locale}`;

  // Warn on unsaved changes before page unload
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Functional state updates target blocks by stable ID to avoid index misalignment across reorders
  const update = (fn: (prev: Block[]) => Block[]) => {
    setBlocks((prev) => {
      const next = fn(prev);
      latest.current = next;
      return next;
    });
    setDirty(true);
    setResult(null);
  };
  const patchById = (id: string, value: Partial<Block>) =>
    update((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...value } as Block) : b)),
    );
  const patch = (index: number, value: Partial<Block>) => {
    const id = blocks[index]?.id;
    if (id) patchById(id, value);
  };
  const move = (index: number, delta: -1 | 1) =>
    update((prev) => {
      const target = index + delta;
      return target < 0 || target >= prev.length
        ? prev
        : arrayMove(prev, index, target);
    });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update((prev) => {
      const from = prev.findIndex((b) => b.id === active.id);
      const to = prev.findIndex((b) => b.id === over.id);
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
    });
  };

  // Structure cloning from primary locale with overwrite confirmation
  const [confirmCopy, setConfirmCopy] = useState(false);
  const copy = () => {
    if (!copyFrom) return;
    update(() => copyStructure(copyFrom.blocks));
    setConfirmCopy(false);
  };

  const save = () =>
    startTransition(async () => {
      const r = await updateBlocks({
        projectId,
        locale,
        blocks: latest.current,
      });
      setResult(r);
      if (r.ok) {
        setDirty(false);
        toast.success(`Contenu ${locale.toUpperCase()} enregistré`);
      } else {
        toast.error(r.message);
      }
    });

  const errorsFor = (index: number) =>
    result && !result.ok && result.fieldErrors
      ? Object.entries(result.fieldErrors)
          .filter(([k]) => k === String(index) || k.startsWith(`${index}.`))
          .map(
            ([k, v]) =>
              `${readablePath(k.split(".").slice(1).join("."))} : ${v.join(", ")}`,
          )
      : [];

  // ── Input field helpers ───────────────────────────────────────────────────
  const row = (children: React.ReactNode, className?: string) => (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>{children}</div>
  );
  const textInput = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { maxLength?: number; lang?: string; className?: string } = {},
  ) => (
    <div className={cn("grid gap-1.5", opts.className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        maxLength={opts.maxLength}
        lang={opts.lang}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
  const caption = (b: Block & { caption?: string }, i: number) =>
    textInput(
      `${p}-${i}-caption`,
      "Légende (facultative)",
      b.caption ?? "",
      (v) => patch(i, { caption: v || undefined }),
      {
        maxLength: 280,
        lang: locale,
      },
    );
  const choice = <T extends string | number>(
    id: string,
    label: string,
    value: T,
    options: [T, string][],
    onChange: (v: T) => void,
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          onChange((typeof value === "number" ? Number(raw) : raw) as T);
        }}
        className="w-full"
      >
        {options.map(([v, l]) => (
          <NativeSelectOption key={String(v)} value={String(v)}>
            {l}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );

  const fields = (b: Block, i: number) => {
    const fid = (name: string) => `${p}-${i}-${name}`;
    switch (b.type) {
      case "text":
        return (
          <div className="grid gap-3">
            <RichTextEditor
              id={fid("text")}
              label={`Texte du bloc ${i + 1}`}
              lang={locale}
              value={b.doc}
              onChange={(doc) => patchById(b.id, { doc })}
            />
            <div className="max-w-xs">
              {choice(
                fid("width"),
                "Largeur",
                b.width,
                [
                  ["narrow", "Étroite"],
                  ["wide", "Large"],
                ],
                (v) => patch(i, { width: v }),
              )}
            </div>
          </div>
        );
      case "image":
        return (
          <div className="grid gap-3">
            <MediaPicker
              label="Image"
              media={media}
              kinds={["image", "svg"]}
              value={b.mediaId ? [b.mediaId] : []}
              onChange={(ids) => patchById(b.id, { mediaId: ids[0] ?? "" })}
            />
            {row(
              <>
                {choice(
                  fid("layout"),
                  "Mise en page",
                  b.layout,
                  [
                    ["full", "Pleine largeur"],
                    ["contained", "Contenue"],
                    ["hero", "Hero"],
                  ],
                  (v) => patch(i, { layout: v }),
                )}
                {caption(b, i)}
              </>,
            )}
          </div>
        );
      case "gallery":
        return (
          <div className="grid gap-3">
            <MediaPicker
              label="Images de la galerie"
              hint="2 à 12, dans l'ordre choisi"
              media={media}
              kinds={["image", "svg"]}
              multiple
              max={12}
              value={b.mediaIds}
              onChange={(ids) => patchById(b.id, { mediaIds: ids })}
            />
            {row(
              <>
                {choice(
                  fid("columns"),
                  "Colonnes",
                  b.columns,
                  [
                    [2, "2 colonnes"],
                    [3, "3 colonnes"],
                  ],
                  (v) => patch(i, { columns: v }),
                )}
                {caption(b, i)}
              </>,
            )}
          </div>
        );
      case "video":
        return (
          <div className="grid gap-3">
            <MediaPicker
              label="Vidéo"
              media={media}
              kinds={["video"]}
              value={b.mediaId ? [b.mediaId] : []}
              onChange={(ids) => patchById(b.id, { mediaId: ids[0] ?? "" })}
            />
            {row(
              <>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={b.autoplayLoop}
                    onChange={(e) =>
                      patch(i, { autoplayLoop: e.target.checked })
                    }
                    className="accent-(--color-signal)"
                  />
                  Lecture automatique en boucle
                </label>
                {caption(b, i)}
              </>,
            )}
          </div>
        );
      case "quote":
        return (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={fid("text")}>Citation</Label>
              <Textarea
                id={fid("text")}
                rows={3}
                lang={locale}
                maxLength={600}
                value={b.text}
                onChange={(e) => patch(i, { text: e.target.value })}
              />
            </div>
            <div className="max-w-md">
              {textInput(fid("author"), "Auteur", b.author ?? "", (v) =>
                patch(i, { author: v || undefined }),
              )}
            </div>
          </div>
        );
      case "stats":
        return (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">
              Chiffres clés (1 à 4)
            </legend>
            {b.items.map((item, j) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed item list without unique IDs
                key={j}
                className="grid items-end gap-2 md:grid-cols-[10rem_1fr_auto]"
              >
                {textInput(
                  fid(`value-${j}`),
                  `Valeur ${j + 1}`,
                  item.value,
                  (v) =>
                    patch(i, {
                      items: b.items.map((x, k) =>
                        k === j ? { ...x, value: v } : x,
                      ),
                    }),
                )}
                {textInput(
                  fid(`label-${j}`),
                  "Libellé",
                  item.label,
                  (v) =>
                    patch(i, {
                      items: b.items.map((x, k) =>
                        k === j ? { ...x, label: v } : x,
                      ),
                    }),
                  { lang: locale },
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={b.items.length <= 1}
                  onClick={() =>
                    patch(i, { items: b.items.filter((_, k) => k !== j) })
                  }
                >
                  Retirer
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={b.items.length >= 4}
              onClick={() =>
                patch(i, { items: [...b.items, { value: "", label: "" }] })
              }
            >
              Ajouter un chiffre
            </Button>
          </fieldset>
        );
      case "credits":
        return (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Crédits</legend>
            {b.items.map((item, j) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed item list without unique IDs
                key={j}
                className="grid items-end gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                {textInput(
                  fid(`role-${j}`),
                  `Rôle ${j + 1}`,
                  item.role,
                  (v) =>
                    patch(i, {
                      items: b.items.map((x, k) =>
                        k === j ? { ...x, role: v } : x,
                      ),
                    }),
                  { lang: locale },
                )}
                {textInput(fid(`name-${j}`), "Nom", item.name, (v) =>
                  patch(i, {
                    items: b.items.map((x, k) =>
                      k === j ? { ...x, name: v } : x,
                    ),
                  }),
                )}
                {textInput(
                  fid(`url-${j}`),
                  "Lien (https, facultatif)",
                  item.url ?? "",
                  (v) =>
                    patch(i, {
                      items: b.items.map((x, k) =>
                        k === j ? { ...x, url: v || undefined } : x,
                      ),
                    }),
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patch(i, { items: b.items.filter((_, k) => k !== j) })
                  }
                >
                  Retirer
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() =>
                patch(i, { items: [...b.items, { role: "", name: "" }] })
              }
            >
              Ajouter un crédit
            </Button>
          </fieldset>
        );
      case "embed":
        return row(
          <>
            {choice(
              fid("provider"),
              "Fournisseur",
              b.provider,
              [
                ["vimeo", "Vimeo"],
                ["youtube", "YouTube"],
                ["figma", "Figma"],
              ],
              (v) => patch(i, { provider: v }),
            )}
            {textInput(fid("url"), "URL", b.url, (v) => patch(i, { url: v }))}
          </>,
        );
    }
  };

  if (disabledReason) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        {disabledReason}
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {copyFrom && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (blocks.length ? setConfirmCopy(true) : copy())}
            disabled={copyFrom.blocks.length === 0}
          >
            Copier la structure depuis {copyFrom.label}
          </Button>
          <span className="text-xs text-muted-foreground">
            Mêmes blocs et médias, textes vidés à traduire — pense à enregistrer
            ensuite.
          </span>
          <AlertDialog open={confirmCopy} onOpenChange={setConfirmCopy}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Remplacer le contenu {locale.toUpperCase()} ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Les {blocks.length} bloc(s) actuels seront remplacés par la
                  structure {copyFrom.label}, avec les textes vidés. Rien n'est
                  enregistré tant que tu ne cliques pas sur « Enregistrer ».
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={copy}>Remplacer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {blocks.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun bloc pour l'instant. Ajoute-en un ci-dessous.
        </p>
      )}

      <DndContext
        // Fixed DndContext ID prevents hydration mismatch between server and client
        id={`blocks-dnd-${locale}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="grid gap-3">
            {blocks.map((b, i) => {
              const errors = errorsFor(i);
              return (
                <SortableItem
                  key={b.id}
                  id={b.id}
                  label={`bloc ${i + 1}, ${TYPE_LABELS[b.type]}`}
                >
                  {(handle) => (
                    <fieldset
                      className={cn(
                        "rounded-lg border bg-card p-4",
                        errors.length
                          ? "border-destructive/60"
                          : "border-border",
                      )}
                    >
                      <legend className="sr-only">
                        {i + 1}. {TYPE_LABELS[b.type]}
                      </legend>
                      <div className="mb-3 flex items-center gap-2">
                        {handle}
                        <span className="text-sm font-medium">
                          <span className="tabular-nums text-muted-foreground">
                            {i + 1}.
                          </span>{" "}
                          {TYPE_LABELS[b.type]}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            aria-label={`Monter le bloc ${i + 1}`}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => move(i, 1)}
                            disabled={i === blocks.length - 1}
                            aria-label={`Descendre le bloc ${i + 1}`}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              update((prev) =>
                                prev.filter((x) => x.id !== b.id),
                              )
                            }
                            aria-label={`Supprimer le bloc ${i + 1}`}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                      {fields(b, i)}
                      {errors.length > 0 && (
                        <ul
                          role="alert"
                          className="mt-3 grid gap-0.5 text-xs text-destructive"
                        >
                          {errors.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </fieldset>
                  )}
                </SortableItem>
              );
            })}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${p}-new`}>Nouveau bloc</Label>
          <NativeSelect
            id={`${p}-new`}
            value={newType}
            onChange={(e) => setNewType(e.target.value as BlockType)}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => update((prev) => [...prev, newBlock(newType)])}
        >
          Ajouter
        </Button>
      </div>

      <div aria-live="polite" className="flex items-center gap-3 text-sm">
        <Button type="button" onClick={save} disabled={pending}>
          {pending
            ? "Enregistrement…"
            : `Enregistrer le contenu ${locale.toUpperCase()}`}
        </Button>
        {dirty && !pending && (
          <span className="text-muted-foreground">
            Modifications non enregistrées
          </span>
        )}
        {result?.ok && !dirty && (
          <span className="text-success">Enregistré ✓</span>
        )}
        {result && !result.ok && (
          <span role="alert" className="text-destructive">
            {result.message}
          </span>
        )}
      </div>
    </div>
  );
}
