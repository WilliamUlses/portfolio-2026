"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { githubLogin } from "@/content/people-input";
import {
  createPerson,
  importGithubPhoto,
  updatePerson,
} from "@/server/actions/people";
import type { MediaOption } from "@/server/admin/media";
import type { PersonRow } from "@/server/admin/people";
import { describedBy, FieldError } from "./FieldError";
import { MediaPicker } from "./MediaPicker";

// Collaborator profile form: create or update. Uses controlled fields to preserve user input on validation failure.
type Field = "name" | "githubUrl" | "linkedinUrl" | "websiteUrl";
const FIELDS: Field[] = ["name", "githubUrl", "linkedinUrl", "websiteUrl"];
export function PersonForm({
  person,
  media,
  onDone,
}: {
  person?: PersonRow;
  media: MediaOption[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(
    person ? updatePerson : createPerson,
    null,
  );
  const initial = () =>
    Object.fromEntries(FIELDS.map((f) => [f, person?.[f] ?? ""])) as Record<
      Field,
      string
    >;
  const [values, setValues] = useState(initial);
  // Selected avatar media ID; key forces remount when GitHub avatar is imported.
  const [photo, setPhoto] = useState(person?.photoMediaId ?? "");
  const [photoKey, setPhotoKey] = useState(0);
  const [fetchingPhoto, startPhoto] = useTransition();
  const fromGithub = () =>
    startPhoto(async () => {
      const result = await importGithubPhoto({
        githubUrl: values.githubUrl,
        name: values.name,
      });
      if (!result.ok) return void toast.error(result.message);
      setPhoto(result.data.id);
      setPhotoKey((k) => k + 1);
      toast.success("Photo GitHub ajoutée à la médiathèque");
    });
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(person ? "Collaborateur modifié" : "Collaborateur ajouté");
      if (!person) {
        setValues(
          Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<
            Field,
            string
          >,
        );
        setPhoto("");
        setPhotoKey((k) => k + 1);
      }
      onDone?.();
    } else toast.error(state.message);
  }, [state, person, onDone]);

  const field = (name: Field, label: string, placeholder: string) => {
    const id = `${person?.id ?? "new"}-${name}`;
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          name={name}
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
          placeholder={placeholder}
          required={name === "name"}
          aria-invalid={Boolean(describedBy(state, name))}
          aria-describedby={describedBy(state, name)}
        />
        <FieldError state={state} name={name} />
      </div>
    );
  };

  return (
    <form action={action} className="grid gap-4">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {field("name", "Nom", "Prénom Nom")}
        {field("githubUrl", "GitHub", "https://github.com/…")}
        {field("linkedinUrl", "LinkedIn", "https://www.linkedin.com/in/…")}
        {field("websiteUrl", "Autre lien", "https://… (portfolio, site)")}
      </div>
      <MediaPicker
        key={photoKey}
        name="photoMediaId"
        label="Photo"
        hint="facultatif — sinon, ses initiales"
        media={media}
        kinds={["image", "svg"]}
        value={photo ? [photo] : []}
        onChange={(ids) => setPhoto(ids[0] ?? "")}
      />
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fetchingPhoto || !githubLogin(values.githubUrl)}
          onClick={fromGithub}
        >
          {fetchingPhoto ? "Récupération…" : "Utiliser la photo GitHub"}
        </Button>
      </div>
      <FieldError state={state} name="photoMediaId" />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : person ? "Enregistrer" : "Ajouter"}
        </Button>
        {person && onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
