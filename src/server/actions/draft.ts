"use server";

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

// Exits Draft Mode via POST Server Action to prevent accidental prefetch trigger.
const ID_RE = /^[a-z0-9]{10,40}$/;

export async function exitPreview(formData: FormData): Promise<void> {
  (await draftMode()).disable();
  const id = formData.get("id");
  redirect(
    typeof id === "string" && ID_RE.test(id)
      ? `/admin/projets/${id}`
      : "/admin",
  );
}
