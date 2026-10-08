// Contact form field definitions decoupled from runtime validation schemas for client bundle efficiency.
export const PROJECT_TYPES = [
  "website",
  "identity",
  "motion",
  "other",
] as const;
export const BUDGETS = [
  "lt5k",
  "5to15k",
  "15to30k",
  "gt30k",
  "unknown",
] as const;
/** Inbound contact topic: full-time, freelance, or other. */
export const TOPICS = ["job", "freelance", "other"] as const;
export const CONTACT_FIELDS = [
  "name",
  "email",
  "message",
  "projectType",
  "budget",
  "topic",
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

/** Honeypot anti-spam field: hidden from users, populated only by bots. */
export const HONEYPOT_FIELD = "website";
