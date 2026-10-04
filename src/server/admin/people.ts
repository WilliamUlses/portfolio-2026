import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { media, people, projectPeople } from "@/db/schema";

// Real-time admin queries for team members and project collaborations

export async function listPeople() {
  const rows = await db
    .select({
      id: people.id,
      name: people.name,
      githubUrl: people.githubUrl,
      linkedinUrl: people.linkedinUrl,
      websiteUrl: people.websiteUrl,
      photoMediaId: people.photoMediaId,
      photoUrl: media.url,
    })
    .from(people)
    .leftJoin(media, eq(media.id, people.photoMediaId))
    .orderBy(asc(people.name));
  const counts = await db
    .select({ personId: projectPeople.personId, n: count() })
    .from(projectPeople)
    .groupBy(projectPeople.personId);
  const byPerson = new Map(counts.map((c) => [c.personId, c.n]));
  return rows.map((r) => ({ ...r, projects: byPerson.get(r.id) ?? 0 }));
}
export type PersonRow = Awaited<ReturnType<typeof listPeople>>[number];

/** Returns sorted list of collaborators on a project */
export async function getProjectPeople(projectId: string) {
  return db
    .select({
      personId: projectPeople.personId,
      roleFr: projectPeople.roleFr,
      roleEn: projectPeople.roleEn,
    })
    .from(projectPeople)
    .where(eq(projectPeople.projectId, projectId))
    .orderBy(asc(projectPeople.sortOrder));
}
