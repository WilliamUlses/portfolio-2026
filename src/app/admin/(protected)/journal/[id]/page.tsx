import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlocksEditor } from "@/components/admin/BlocksEditor";
import { PostEditForm } from "@/components/admin/PostEditForm";
import { PublicationPanel } from "@/components/admin/PublicationPanel";
import { publishPost, setPostStatus } from "@/server/actions/posts";
import { listMediaOptions } from "@/server/admin/media";
import { getAdminPost, getPostProblems } from "@/server/admin/posts";

// Admin journal post detail: dynamic queries per request without caching.
export const instant = false;

export const metadata: Metadata = { title: "Article" };

export default async function EditPostPage({
  params,
}: PageProps<"/admin/journal/[id]">) {
  const { id } = await params;
  const [data, mediaOptions, problems] = await Promise.all([
    getAdminPost(id),
    listMediaOptions(),
    getPostProblems(id),
  ]);
  if (!data) notFound();
  const { post, fr, en } = data;
  const translation = (t: typeof fr) => ({
    title: t?.title ?? "",
    excerpt: t?.excerpt ?? "",
    seoTitle: t?.seoTitle ?? "",
    seoDescription: t?.seoDescription ?? "",
  });

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
          {fr?.title || post.slug}
        </h1>
        <p className="text-sm text-muted-foreground">
          /journal/{post.slug} · modifié le{" "}
          {post.updatedAt.toLocaleString("fr-FR", {
            timeZone: "Europe/Paris",
          })}
        </p>
      </div>
      <PublicationPanel
        id={post.id}
        status={post.status}
        problems={problems ?? []}
        publishAction={publishPost}
        statusAction={setPostStatus}
        publishedLabel="Article publié"
      />
      <PostEditForm
        initial={{
          id: post.id,
          slug: post.slug,
          topic: post.topic ?? "",
          coverMediaId: post.coverMediaId ?? "",
          thumbnailTitle: post.thumbnailTitle ?? "",
          fr: translation(fr),
          en: translation(en),
          hasEn: Boolean(en),
        }}
        media={mediaOptions}
      />
      <section aria-labelledby="content-fr" className="grid gap-3">
        <h2 id="content-fr" className="text-lg font-semibold">
          Contenu — français
        </h2>
        <BlocksEditor
          projectId={post.id}
          owner="post"
          locale="fr"
          initial={fr?.blocks ?? []}
          media={mediaOptions}
        />
      </section>
      <section aria-labelledby="content-en" lang="en" className="grid gap-3">
        <h2 id="content-en" className="text-lg font-semibold">
          Contenu — English
        </h2>
        <BlocksEditor
          projectId={post.id}
          owner="post"
          locale="en"
          initial={en?.blocks ?? []}
          media={mediaOptions}
          copyFrom={{ label: "FR", blocks: fr?.blocks ?? [] }}
          disabledReason={
            en
              ? undefined
              : "Saisis d'abord un titre EN (formulaire ci-dessus) pour créer la traduction anglaise."
          }
        />
      </section>
    </main>
  );
}
