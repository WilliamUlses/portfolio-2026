import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { listAdminPosts } from "@/server/admin/posts";

// Admin journal list: fresh query on every navigation.
export const instant = false;

export const metadata: Metadata = { title: "Journal" };

const date = (d: Date | null) =>
  d ? d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "—";

export default async function AdminJournalPage() {
  await connection();
  const rows = await listAdminPosts();
  return (
    <main className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} article{rows.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/journal/nouveau">Nouvel article</Link>
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          Aucun article pour l'instant. La page Journal du site reste masquée du
          menu tant qu'aucun article n'est publié.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Langues</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Publié le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link
                    href={`/admin/journal/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.titleFr || p.slug}
                  </Link>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </TableCell>
                <TableCell>{p.topic ?? "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Badge variant="secondary">fr</Badge>
                  <Badge variant={p.hasEn ? "secondary" : "outline"}>
                    en{p.hasEn ? "" : " —"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell>{date(p.publishedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
