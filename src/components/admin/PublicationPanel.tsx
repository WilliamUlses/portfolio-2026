"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/admin/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { publishProject, setProjectStatus } from "@/server/actions/publication";

type Status = "draft" | "published" | "archived";

// Publication status panel: displays current state, blocking validation issues, and publish actions.
export function PublicationPanel({
  id,
  status,
  problems,
}: {
  id: string;
  status: Status;
  problems: string[];
}) {
  const [publishState, publish, publishing] = useActionState(
    publishProject,
    null,
  );
  const [statusState, changeStatus, changing] = useActionState(
    setProjectStatus,
    null,
  );
  const pending = publishing || changing;

  useEffect(() => {
    if (publishState?.ok) toast.success("Projet publié");
    else if (publishState) toast.error(publishState.message);
  }, [publishState]);
  useEffect(() => {
    if (statusState?.ok) toast.success("Statut mis à jour");
    else if (statusState) toast.error(statusState.message);
  }, [statusState]);

  const run = (
    action: (d: FormData) => void,
    extra?: Record<string, string>,
  ) => {
    const data = new FormData();
    data.set("id", id);
    for (const [k, v] of Object.entries(extra ?? {})) data.set(k, v);
    startTransition(() => action(data));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Publication</h2>
          <StatusBadge status={status} />
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {status !== "published" && (
            <Button
              disabled={pending || problems.length > 0}
              onClick={() => run(publish)}
            >
              {publishing ? "Publication…" : "Publier"}
            </Button>
          )}
          {status === "published" && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run(changeStatus, { status: "draft" })}
            >
              Dépublier
            </Button>
          )}
          {status !== "archived" && (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => run(changeStatus, { status: "archived" })}
            >
              Archiver
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {problems.length > 0 ? (
          <div className="grid gap-2 text-sm">
            <p className="text-muted-foreground">
              {problems.length} point{problems.length > 1 ? "s" : ""} à régler
              avant de publier :
            </p>
            <ul className="grid list-disc gap-1 pl-5">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-success">
            {status === "published"
              ? "En ligne et conforme aux règles ✓"
              : "Prêt à être publié ✓"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
