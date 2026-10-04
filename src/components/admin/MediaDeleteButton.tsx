"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
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
import { deleteMedia } from "@/server/actions/media";

// Media deletion with confirmation dialog; rejected by server if referenced by any project.
export function MediaDeleteButton({
  id,
  name,
  used,
}: {
  id: string;
  name: string;
  used: boolean;
}) {
  const [state, action, pending] = useActionState(deleteMedia, null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (state?.ok) toast.success("Média supprimé");
    else if (state) toast.error(state.message);
  }, [state]);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        {pending ? "Suppression…" : "Supprimer"}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              {used
                ? "Ce média est utilisé : la suppression sera refusée tant qu'il n'est pas retiré des projets concernés."
                : "Le fichier sera supprimé définitivement du stockage."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const data = new FormData();
                data.set("id", id);
                startTransition(() => action(data));
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
