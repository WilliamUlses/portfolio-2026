"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/button";
import { deleteOrphans, findOrphans } from "@/server/actions/media";

// Blob storage orphan cleaner: list unreferenced files, prompt confirmation, and prune.
export function OrphanCleaner() {
  const [urls, setUrls] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <section
      aria-labelledby="orphans-title"
      className="grid gap-3 rounded-lg border border-border p-4"
    >
      <h2 id="orphans-title" className="text-lg font-semibold">
        Fichiers orphelins
      </h2>
      <p>
        Fichiers présents dans le stockage mais absents de la médiathèque
        (upload interrompu…).
      </p>
      <Button
        variant="outline"
        className="w-fit"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await findOrphans();
            setUrls(r.ok ? r.data.urls : []);
            setMessage(r.ok ? "" : r.message);
          })
        }
      >
        {pending && urls === null ? "Recherche…" : "Rechercher les orphelins"}
      </Button>
      {urls && (
        <div aria-live="polite">
          {urls.length === 0 ? (
            <p>Aucun fichier orphelin ✓</p>
          ) : (
            <>
              <p>{urls.length} fichier(s) orphelin(s) :</p>
              <ul>
                {urls.map((u) => (
                  <li key={u}>
                    <a href={u} target="_blank" rel="noreferrer">
                      {new URL(u).pathname}
                    </a>
                  </li>
                ))}
              </ul>
              <Button
                variant="destructive"
                className="w-fit"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteOrphans(urls);
                    setMessage(
                      r.ok
                        ? `${r.data.deleted} fichier(s) supprimé(s) ✓`
                        : r.message,
                    );
                    setUrls(null);
                  })
                }
              >
                Supprimer ces {urls.length} fichier(s)
              </Button>
            </>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
