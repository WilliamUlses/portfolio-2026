import { z } from "zod";
import "./zod-fr";

// Contact form input validation, rate limits, and plain text email formatter.

import { BUDGETS, PROJECT_TYPES, TOPICS } from "./contact-fields";

export {
  BUDGETS,
  CONTACT_FIELDS,
  type ContactField,
  HONEYPOT_FIELD,
  PROJECT_TYPES,
  TOPICS,
} from "./contact-fields";

const optionalChoice = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.enum(values).optional());

export const ContactInput = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(200).pipe(z.email()),
  message: z.string().trim().min(10).max(5000),
  projectType: optionalChoice(PROJECT_TYPES),
  budget: optionalChoice(BUDGETS),
  // Optional field, present primarily on homepage contact form
  topic: optionalChoice(TOPICS).optional(),
});
export type ContactInput = z.infer<typeof ContactInput>;

// Per-IP rate limiting: 3 submissions per hour, 10 per 24 hours.
export const RATE_LIMITS = { perHour: 3, perDay: 10 } as const;
export function isRateLimited(lastHour: number, lastDay: number): boolean {
  return lastHour >= RATE_LIMITS.perHour || lastDay >= RATE_LIMITS.perDay;
}

// Plaintext email composition sent to site administrator.
const TYPE_LABELS: Record<(typeof PROJECT_TYPES)[number], string> = {
  website: "Site web",
  identity: "Identité visuelle",
  motion: "Motion",
  other: "Autre",
};
const TOPIC_LABELS: Record<(typeof TOPICS)[number], string> = {
  job: "CDI",
  freelance: "Freelance",
  other: "Autre",
};
const BUDGET_LABELS: Record<(typeof BUDGETS)[number], string> = {
  lt5k: "< 5 k€",
  "5to15k": "5–15 k€",
  "15to30k": "15–30 k€",
  gt30k: "> 30 k€",
  unknown: "Je ne sais pas encore",
};

export function buildContactEmail(
  input: ContactInput,
  locale: "fr" | "en",
): { subject: string; text: string } {
  // Strip newlines to prevent header injection in email subject
  const name = input.name.replace(/[\r\n]+/g, " ");
  return {
    subject: `[Portfolio] ${input.topic ? `${TOPIC_LABELS[input.topic]} — ` : ""}Message de ${name}`,
    text: [
      `Nom : ${name}`,
      `E-mail : ${input.email}`,
      `Langue du site : ${locale.toUpperCase()}`,
      `Objet : ${input.topic ? TOPIC_LABELS[input.topic] : "—"}`,
      `Type de projet : ${input.projectType ? TYPE_LABELS[input.projectType] : "—"}`,
      `Budget : ${input.budget ? BUDGET_LABELS[input.budget] : "—"}`,
      "",
      input.message,
    ].join("\n"),
  };
}
