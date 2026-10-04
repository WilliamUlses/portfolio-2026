import type { Metadata } from "next";
import Link from "next/link";
import { ProjectOrderList } from "@/components/admin/ProjectOrderList";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { cn } from "@/lib/utils";
import { listAdminProjects, type ProjectStatus } from "@/server/admin/projects";

// Admin dashboard: dynamic real-time database queries on every navigation.
export const instant = false;

export const metadata: Metadata = { title: "Projets" };

// Dashboard project status filters and labels.
const FILTERS: { value?: ProjectStatus; label: string }[] = [
  { label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "published", label: "Publiés" },
  { value: "archived", label: "Archivés" },
];
const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

function isStatus(v: unknown): v is ProjectStatus {
  return v === "draft" || v === "published" || v === "archived";
}

function LocaleBadge({
  locale,
  complete,
}: {
  locale: string;
  complete: boolean;
}) {
  return (
    <Badge
      variant={complete ? "secondary" : "outline"}
      className={cn(!complete && "text-muted-foreground")}
    >
      {locale} {complete ? "✓" : "incomplet"}
    </Badge>
  );
}

export default async function AdminDashboard({
  searchParams,
}: PageProps<"/admin">) {
  const { statut } = await searchParams;
  const status = isStatus(statut) ? statut : undefined;
  const rows = await listAdminProjects(status);

  return (
    <main className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} projet{rows.length > 1 ? "s" : ""}
            {status
              ? ` · ${STATUS_LABEL[status].toLowerCase()}${rows.length > 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/projets/nouveau">Nouveau projet</Link>
        </Button>
      </div>

      <nav aria-label="Filtrer par statut">
        <ul className="flex flex-wrap gap-1 rounded-lg border border-border p-1 text-sm w-fit">
          {FILTERS.map((f) => {
            const active = f.value === status;
            return (
              <li key={f.label}>
                <Link
                  href={f.value ? `/admin?statut=${f.value}` : "/admin"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-1 transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Aucun projet
          {status ? ` avec le statut « ${STATUS_LABEL[status]} »` : ""}.
        </p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableCaption className="sr-only">Liste des projets</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Langues</TableHead>
                <TableHead>Accueil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/admin/projets/${p.id}`}
                      className="font-medium hover:underline underline-offset-4"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      /{p.slug}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{p.year}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <LocaleBadge locale="FR" complete={p.frComplete} />
                      <LocaleBadge locale="EN" complete={p.enComplete} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.featured ? "Mis en avant" : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!status && rows.length > 1 && (
        <ProjectOrderList
          initial={rows.map((p) => ({
            id: p.id,
            title: p.title,
            status: STATUS_LABEL[p.status],
          }))}
        />
      )}
    </main>
  );
}
