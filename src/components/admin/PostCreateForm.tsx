"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { createPost } from "@/server/actions/posts";
import { describedBy, FieldError } from "./FieldError";

// Journal post creation: FR title + slug, created as a draft.
export function PostCreateForm() {
  const [state, action, pending] = useActionState(createPost, null);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="grid max-w-xl gap-4"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="titleFr">Titre (FR)</Label>
        <Input
          id="titleFr"
          name="titleFr"
          required
          aria-describedby={describedBy(state, "titleFr")}
        />
        <FieldError state={state} name="titleFr" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="slug">
          Slug
          <span className="font-normal text-muted-foreground">
            {" "}
            — URL, identique en FR et EN
          </span>
        </Label>
        <Input
          id="slug"
          name="slug"
          required
          aria-describedby={describedBy(state, "slug")}
        />
        <FieldError state={state} name="slug" />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Création…" : "Créer le brouillon"}
      </Button>
    </form>
  );
}
