"use client";

import { startTransition, useActionState } from "react";
import { createProject } from "@/server/actions/projects";
import { describedBy, FieldError } from "./FieldError";

export function ProjectCreateForm() {
  const [state, action, pending] = useActionState(createProject, null);

  return (
    <form
      // Manual submit handler preserves form input values across validation errors
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
    >
      <p>
        <label htmlFor="titleFr">Titre (FR)</label>
        <FieldError state={state} name="titleFr" />
        <br />
        <input
          id="titleFr"
          name="titleFr"
          required
          aria-describedby={describedBy(state, "titleFr")}
        />
      </p>
      <p>
        <label htmlFor="slug">Slug (URL, identique en FR et EN)</label>
        <FieldError state={state} name="slug" />
        <br />
        <input
          id="slug"
          name="slug"
          required
          aria-describedby={describedBy(state, "slug")}
        />
      </p>
      <p>
        <label htmlFor="year">Année</label>
        <FieldError state={state} name="year" />
        <br />
        <input
          id="year"
          name="year"
          type="number"
          inputMode="numeric"
          defaultValue={new Date().getFullYear()}
          required
          aria-describedby={describedBy(state, "year")}
        />
      </p>
      {state && !state.ok && <p role="alert">{state.message}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le brouillon"}
      </button>
    </form>
  );
}
