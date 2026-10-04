"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
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
import { Card, CardContent } from "@/components/admin/ui/card";
import { deletePerson } from "@/server/actions/people";
import type { MediaOption } from "@/server/admin/media";
import type { PersonRow } from "@/server/admin/people";
import { PersonForm } from "./PersonForm";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function Avatar({ person }: { person: PersonRow }) {
  return person.photoUrl ? (
    <Image
      src={person.photoUrl}
      alt=""
      width={48}
      height={48}
      className="size-12 rounded-full object-cover"
    />
  ) : (
    <span className="grid size-12 place-items-center rounded-full bg-accent text-sm font-medium">
      {initialsOf(person.name)}
    </span>
  );
}

function DeleteButton({ person }: { person: PersonRow }) {
  const [pending, startDelete] = useTransition();
  const [open, setOpen] = useState(false);
  // Trigger notification imperatively: the row unmounts immediately on deletion before an effect would run.
  const remove = () =>
    startDelete(async () => {
      const data = new FormData();
      data.set("id", person.id);
      const result = await deletePerson(null, data);
      if (result.ok) toast.success("Collaborateur supprimé");
      else toast.error(result.message);
    });
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        {pending ? "Suppression…" : "Supprimer"}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {person.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              {person.projects
                ? `Il sera retiré de ${person.projects} projet${person.projects > 1 ? "s" : ""}.`
                : "Il n'apparaît dans aucun projet."}{" "}
              Sa photo reste dans la médiathèque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const LINKS = [
  ["githubUrl", "GitHub"],
  ["linkedinUrl", "LinkedIn"],
  ["websiteUrl", "Lien"],
] as const;

// Collaborator directory: roster cards with inline editing.
export function PeopleList({
  people,
  media,
}: {
  people: PersonRow[];
  media: MediaOption[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  if (!people.length)
    return (
      <p className="text-sm text-muted-foreground">
        Aucun collaborateur pour l'instant.
      </p>
    );
  return (
    <ul className="grid gap-3">
      {people.map((p) => (
        <li key={p.id}>
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar person={p} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.projects
                      ? `${p.projects} projet${p.projects > 1 ? "s" : ""}`
                      : "aucun projet"}
                    {LINKS.map(([key, label]) =>
                      p[key] ? (
                        <span key={key}>
                          {" · "}
                          <a
                            href={p[key] ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            {label} ↗
                          </a>
                        </span>
                      ) : null,
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(editing === p.id ? null : p.id)}
                  >
                    {editing === p.id ? "Fermer" : "Modifier"}
                  </Button>
                  <DeleteButton person={p} />
                </div>
              </div>
              {editing === p.id ? (
                <PersonForm
                  person={p}
                  media={media}
                  onDone={() => setEditing(null)}
                />
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
