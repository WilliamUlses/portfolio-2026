"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { updateMediaAlts } from "@/server/actions/media";

export function MediaAltForm({
  id,
  altFr,
  altEn,
}: {
  id: string;
  altFr: string;
  altEn: string;
}) {
  const [state, action, pending] = useActionState(updateMediaAlts, null);
  useEffect(() => {
    if (state?.ok) toast.success("Textes alternatifs enregistrés");
    else if (state) toast.error(state.message);
  }, [state]);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-1">
        <Label htmlFor={`alt-fr-${id}`} className="text-xs">
          Texte alternatif FR
        </Label>
        <Input
          id={`alt-fr-${id}`}
          name="altFr"
          defaultValue={altFr}
          lang="fr"
          maxLength={300}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`alt-en-${id}`} className="text-xs">
          Alt text EN
        </Label>
        <Input
          id={`alt-en-${id}`}
          name="altEn"
          defaultValue={altEn}
          lang="en"
          maxLength={300}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={pending}
        className="w-fit"
      >
        {pending ? "…" : "Enregistrer les alt"}
      </Button>
    </form>
  );
}
