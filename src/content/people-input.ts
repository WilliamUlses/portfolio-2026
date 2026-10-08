import { z } from "zod";

// People and collaborators input validation schema.
/** Transforms empty input to null; otherwise validates HTTPS URL with allowed host. */
const link = (hosts: readonly string[] | null, message: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z
        .url({ protocol: /^https$/, message: "lien https requis" })
        .refine(
          (v) => {
            if (!hosts) return true;
            try {
              return hosts.includes(new URL(v).hostname);
            } catch {
              return false;
            }
          },
          { message },
        )
        .nullable(),
    );

export const GITHUB_HOSTS = ["github.com", "www.github.com"] as const;
export const LINKEDIN_HOSTS = [
  "linkedin.com",
  "www.linkedin.com",
  "fr.linkedin.com",
] as const;

export const PersonInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "nom requis")
    .max(100, "100 caractères maximum"),
  githubUrl: link(GITHUB_HOSTS, "lien GitHub (github.com) attendu"),
  linkedinUrl: link(LINKEDIN_HOSTS, "lien LinkedIn (linkedin.com) attendu"),
  websiteUrl: link(null, "lien https requis"),
  photoMediaId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
});
export type PersonInput = z.infer<typeof PersonInput>;

export const UpdatePersonInput = PersonInput.extend({ id: z.string().min(1) });

/** Project collaborator team in display order */
export const ProjectPeopleInput = z.object({
  projectId: z.string().min(1),
  people: z
    .array(
      z.object({
        personId: z.string().min(1),
        roleFr: z.string().trim().max(80, "80 caractères maximum"),
        roleEn: z.string().trim().max(80, "80 caractères maximum"),
      }),
    )
    .max(30, "30 personnes maximum")
    .refine(
      (list) => new Set(list.map((p) => p.personId)).size === list.length,
      "une personne apparaît deux fois",
    ),
});
export type ProjectPeopleInput = z.infer<typeof ProjectPeopleInput>;

/**
 * Extracts GitHub handle from profile URL (`https://github.com/user` -> `user`), or null.
 */
export function githubLogin(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (
    parsed.protocol !== "https:" ||
    !(GITHUB_HOSTS as readonly string[]).includes(parsed.hostname)
  )
    return null;
  const [login, ...rest] = parsed.pathname.split("/").filter(Boolean);
  if (!login || rest.length) return null;
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(login) ? login : null;
}
