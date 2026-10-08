import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlocksEditor } from "@/components/admin/BlocksEditor";
import { ProjectEditForm } from "@/components/admin/ProjectEditForm";
import { ProjectPeopleEditor } from "@/components/admin/ProjectPeopleEditor";
import { PublicationPanel } from "@/components/admin/PublicationPanel";
import { Button } from "@/components/admin/ui/button";
import { listMediaOptions } from "@/server/admin/media";
import { getProjectPeople, listPeople } from "@/server/admin/people";
import { getAdminProject, getTaxonomyOptions } from "@/server/admin/projects";
import { getPublicationProblems } from "@/server/admin/publication";

// Admin project detail view: dynamic queries per request without caching.
export const instant = false;

export const metadata: Metadata = { title: "Projet" };

export default async function EditProjectPage({
  params,
}: PageProps<"/admin/projets/[id]">) {
  const { id } = await params;
  const [data, options, mediaOptions, problems, people, team] =
    await Promise.all([
      getAdminProject(id),
      getTaxonomyOptions(),
      listMediaOptions(),
      getPublicationProblems(id),
      listPeople(),
      getProjectPeople(id),
    ]);
  if (!data) notFound();

  const { project, fr, en, tagIds } = data;
  const translation = (t: typeof fr) => ({
    title: t?.title ?? "",
    subtitle: t?.subtitle ?? "",
    role: t?.role ?? "",
    summary: t?.summary ?? "",
    seoTitle: t?.seoTitle ?? "",
    seoDescription: t?.seoDescription ?? "",
  });

  return (
    <main className="grid gap-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Projets
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {fr?.title || project.slug}
        </h1>
        <p className="text-sm text-muted-foreground">
          /{project.slug} · modifié le{" "}
          {project.updatedAt.toLocaleString("fr-FR", {
            timeZone: "Europe/Paris",
          })}
        </p>
        {/* Draft mode preview uses native <a> tags to prevent prefetching /api/draft */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(["fr", "en"] as const).map((l) =>
            (l === "fr" ? fr : en) ? (
              <Button key={l} asChild variant="outline" size="sm">
                <a
                  href={`/api/draft?id=${project.id}&locale=${l}`}
                  target="_blank"
                  rel="noopener"
                >
                  Aperçu {l.toUpperCase()} ↗
                </a>
              </Button>
            ) : null,
          )}
        </div>
      </div>
      <PublicationPanel
        id={project.id}
        status={project.status}
        problems={problems ?? []}
      />
      <ProjectEditForm
        initial={{
          id: project.id,
          slug: project.slug,
          year: project.year,
          client: project.client ?? "",
          categoryId: project.categoryId ?? "",
          tagIds,
          accentColor: project.accentColor,
          externalUrl: project.externalUrl ?? "",
          featured: project.featured,
          coverMediaId: project.coverMediaId ?? "",
          previewMediaId: project.previewMediaId ?? "",
          ogMediaId: project.ogMediaId ?? "",
          fr: translation(fr),
          en: translation(en),
          hasEn: Boolean(en),
        }}
        categories={options.categories}
        tags={options.tags}
        media={mediaOptions}
      />
      <section aria-labelledby="content-fr" className="grid gap-3">
        <h2 id="content-fr" className="text-lg font-semibold">
          Contenu — français
        </h2>
        <BlocksEditor
          projectId={project.id}
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
          projectId={project.id}
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
      <ProjectPeopleEditor
        projectId={project.id}
        people={people}
        initial={team}
      />
    </main>
  );
}
