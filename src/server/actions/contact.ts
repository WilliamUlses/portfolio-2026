"use server";

import { createHmac } from "node:crypto";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { Resend } from "resend";
import {
  buildContactEmail,
  CONTACT_FIELDS,
  type ContactField,
  ContactInput,
  HONEYPOT_FIELD,
  isRateLimited,
} from "@/content/contact";
import { db } from "@/db/client";
import { contactAttempts } from "@/db/schema";
import { isLocale } from "@/i18n/config";
import { env } from "@/lib/env";

// Public contact form Server Action sending messages via Resend.
// Protected by honeypot field and salted IP hash rate limiting.

export type ContactState =
  | { status: "idle" }
  | { status: "sent"; name?: string; email?: string }
  | {
      status: "error";
      code: "invalid" | "rate" | "unavailable";
      fields: ContactField[];
      values: Partial<Record<ContactField, string>>;
    };

const HOUR = 60 * 60 * 1000;

async function ipHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  // Salted HMAC hash: raw IP is never persisted
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`contact:${ip}`)
    .digest("hex");
}

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = Object.fromEntries(
    CONTACT_FIELDS.map((f) => [f, String(formData.get(f) ?? "")]),
  ) as Record<ContactField, string>;
  const fail = (
    code: "invalid" | "rate" | "unavailable",
    fields: ContactField[] = [],
  ): ContactState => ({ status: "error", code, fields, values });

  // Honeypot check: return sent status silently to prevent bot adaptation
  if (String(formData.get(HONEYPOT_FIELD) ?? "") !== "") {
    return { status: "sent" };
  }

  const parsed = ContactInput.safeParse(values);
  if (!parsed.success) {
    const fields = [
      ...new Set(parsed.error.issues.map((i) => i.path[0] as ContactField)),
    ];
    return fail("invalid", fields);
  }
  const locale = formData.get("locale");

  const hash = await ipHash();
  const now = Date.now();
  const since = (ms: number) =>
    db
      .select({ n: count() })
      .from(contactAttempts)
      .where(
        and(
          eq(contactAttempts.ipHash, hash),
          gte(contactAttempts.createdAt, new Date(now - ms)),
        ),
      )
      .then((r) => r[0]?.n ?? 0);
  const [lastHour, lastDay] = await Promise.all([
    since(HOUR),
    since(24 * HOUR),
  ]);
  if (isRateLimited(lastHour, lastDay)) return fail("rate");

  const email = buildContactEmail(
    parsed.data,
    isLocale(locale) ? locale : "fr",
  );
  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[contact] Dev mode: Resend not configured, email logged:\n${email.subject}\n${email.text}`,
      );
    } else {
      console.error("[contact] Resend credentials missing in production");
      return fail("unavailable");
    }
  } else {
    const { error } = await new Resend(RESEND_API_KEY).emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      replyTo: parsed.data.email,
      subject: email.subject,
      text: email.text,
    });
    if (error) {
      console.error("[contact] Resend error:", error.name, error.message);
      return fail("unavailable");
    }
  }

  // Record attempt and purge records older than 24h
  await db.insert(contactAttempts).values({ ipHash: hash });
  await db
    .delete(contactAttempts)
    .where(lt(contactAttempts.createdAt, new Date(now - 24 * HOUR)));
  return {
    status: "sent",
    name: parsed.data.name,
    email: parsed.data.email,
  };
}
