import type { Metadata } from "next";
import Link from "next/link";
import { PostCreateForm } from "@/components/admin/PostCreateForm";

export const metadata: Metadata = { title: "Nouvel article" };

export default function NewPostPage() {
  return (
    <main className="grid gap-6">
      <div>
        <Link
          href="/admin/journal"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Journal
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Nouvel article
        </h1>
        <p className="text-sm text-muted-foreground">
          L'article est créé en brouillon ; le reste se remplit ensuite.
        </p>
      </div>
      <PostCreateForm />
    </main>
  );
}
