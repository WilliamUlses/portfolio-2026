import { z } from "zod";

// Runtime validation of environment variables
const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.email().optional(),
  CONTACT_FROM_EMAIL: z.string().min(3).optional(),
});

// Allow skipping validation for dry builds (e.g. CI without production secrets)
const skip = process.env.SKIP_ENV_VALIDATION === "true";

export const env = skip
  ? (process.env as unknown as z.infer<typeof schema>)
  : schema.parse(process.env);
