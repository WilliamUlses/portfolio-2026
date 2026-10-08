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
import { useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/button";
import type { ActionResult } from "@/content/project-input";
import { reorderProjects } from "@/server/actions/publication";

type Row = { id: string; title: string; status: string };

function Item({
  row,
  index,
  total,
  move,
}: {
  row: Row;
  index: number;
  total: number;
  move: (i: number, d: -1 | 1) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm ${isDragging ? "opacity-60" : ""}`}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        {...attributes}
        {...listeners}
        aria-label={`Déplacer : ${row.title} (Espace puis flèches)`}
        className="cursor-grab"
      >
        ⠿
      </Button>
      <span className="w-6 text-right tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      <span className="flex-1">{row.title}</span>
      <span className="text-xs text-muted-foreground">{row.status}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => move(index, -1)}
        disabled={index === 0}
        aria-label={`Monter ${row.title}`}
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => move(index, 1)}
        disabled={index === total - 1}
        aria-label={`Descendre ${row.title}`}
      >
        ↓
      </Button>
    </li>
  );
}

// Reorderable project list: drag-and-drop or arrow buttons; batch saved in a single transaction.
export function ProjectOrderList({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const reorder = (fn: (prev: Row[]) => Row[]) => {
    setRows(fn);
    setDirty(true);
    setResult(null);
  };
  const move = (i: number, d: -1 | 1) =>
    reorder((prev) =>
      i + d < 0 || i + d >= prev.length ? prev : arrayMove(prev, i, i + d),
    );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    reorder((prev) =>
      arrayMove(
        prev,
        prev.findIndex((r) => r.id === active.id),
        prev.findIndex((r) => r.id === over.id),
      ),
    );
  };

  return (
    <section aria-labelledby="order-title" className="grid gap-3">
      <div>
        <h2 id="order-title" className="text-lg font-semibold">
          Ordre d'affichage
        </h2>
        <p className="text-sm text-muted-foreground">
          Ordre des projets sur le site. Glisse avec ⠿ ou utilise ↑ ↓.
        </p>
      </div>
      <DndContext
        id="projects-order"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={rows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="grid gap-1">
            {rows.map((row, i) => (
              <Item
                key={row.id}
                row={row}
                index={i}
                total={rows.length}
                move={move}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <p aria-live="polite" className="flex items-center gap-3 text-sm">
        <Button
          disabled={!dirty || pending}
          onClick={() =>
            startTransition(async () => {
              const r = await reorderProjects(rows.map((row) => row.id));
              setResult(r);
              if (r.ok) setDirty(false);
            })
          }
        >
          {pending ? "Enregistrement…" : "Enregistrer l'ordre"}
        </Button>
        {dirty && !pending && (
          <span className="text-muted-foreground">
            Ordre modifié, non enregistré
          </span>
        )}
        {result?.ok && !dirty && (
          <span className="text-success">Ordre enregistré ✓</span>
        )}
        {result && !result.ok && (
          <span role="alert" className="text-destructive">
            {result.message}
          </span>
        )}
      </p>
    </section>
  );
}
