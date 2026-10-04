"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/admin/ui/native-select";
import { setProjectPeople } from "@/server/actions/people";
import type { PersonRow } from "@/server/admin/people";
import { Avatar } from "./PeopleList";

type Row = { personId: string; roleFr: string; roleEn: string };

// Project collaborators roster editor: role translations (FR / EN) and display ordering.
export function ProjectPeopleEditor({
  projectId,
  people,
  initial,
}: {
  projectId: string;
  people: PersonRow[];
  initial: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [toAdd, setToAdd] = useState("");
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const byId = new Map(people.map((p) => [p.id, p]));
  const available = people.filter(
    (p) => !rows.some((r) => r.personId === p.id),
  );
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRows((all) => {
      const next = [...all];
      const [r] = next.splice(i, 1);
      if (r) next.splice(i + d, 0, r);
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const res = await setProjectPeople({ projectId, people: rows });
      if (res.ok) {
        setErrors({});
        toast.success("Équipe enregistrée");
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.message);
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborateurs</CardTitle>
        <CardDescription>
          Affichés en fin d'étude de cas, dans cet ordre.{" "}
          <Link
            href="/admin/collaborateurs"
            className="underline underline-offset-2"
          >
            Gérer les collaborateurs
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {rows.length ? (
          <ol className="grid gap-3">
            {rows.map((r, i) => {
              const person = byId.get(r.personId);
              if (!person) return null;
              return (
                <li
                  key={r.personId}
                  className="grid items-center gap-3 rounded-md border border-border p-3 md:grid-cols-[auto_1fr_1fr_1fr_auto]"
                >
                  <Avatar person={person} />
                  <p className="font-medium">{person.name}</p>
                  <Input
                    aria-label={`Rôle de ${person.name} (FR)`}
                    placeholder="Rôle (FR)"
                    value={r.roleFr}
                    maxLength={80}
                    onChange={(e) => update(i, { roleFr: e.target.value })}
                  />
                  <Input
                    aria-label={`Rôle de ${person.name} (EN)`}
                    placeholder="Role (EN)"
                    value={r.roleEn}
                    maxLength={80}
                    onChange={(e) => update(i, { roleEn: e.target.value })}
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Monter ${person.name}`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Descendre ${person.name}`}
                      disabled={i === rows.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setRows((all) => all.filter((_, j) => j !== i))
                      }
                    >
                      Retirer
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun collaborateur sur ce projet.
          </p>
        )}
        {Object.values(errors).flat().length ? (
          <p role="alert" className="text-xs text-destructive">
            {Object.values(errors).flat().join(", ")}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {available.length ? (
            <>
              <NativeSelect
                aria-label="Collaborateur à ajouter"
                value={toAdd}
                onChange={(e) => setToAdd(e.target.value)}
              >
                <NativeSelectOption value="">
                  — Ajouter un collaborateur —
                </NativeSelectOption>
                {available.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button
                type="button"
                variant="outline"
                disabled={!toAdd}
                onClick={() => {
                  setRows((all) => [
                    ...all,
                    { personId: toAdd, roleFr: "", roleEn: "" },
                  ]);
                  setToAdd("");
                }}
              >
                Ajouter au projet
              </Button>
            </>
          ) : people.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Créez d'abord vos collaborateurs dans la page{" "}
              <Link
                href="/admin/collaborateurs"
                className="underline underline-offset-2"
              >
                Collaborateurs
              </Link>
              .
            </p>
          ) : null}
          <Button
            type="button"
            className="ml-auto"
            disabled={!dirty || pending}
            onClick={save}
          >
            {pending ? "Enregistrement…" : "Enregistrer l'équipe"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
