import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

// Authentication configuration using Better Auth with single-admin provisioning
const isProduction = process.env.VERCEL_ENV === "production";
const passkeyDomain = isProduction
  ? { rpID: "williamulses.fr", origin: ["https://williamulses.fr"] }
  : {
      rpID: "localhost",
      origin: ["http://localhost:3000", "http://localhost:3100"],
    };

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
  baseURL: {
    allowedHosts: [
      "williamulses.fr",
      "localhost:3000",
      "localhost:3100",
      "portfolio-2026-ivory-mu.vercel.app",
      "portfolio-2026-*-willi78960-1240s-projects.vercel.app",
    ],
    fallback: "https://williamulses.fr",
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 14,
    maxPasswordLength: 128,
  },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  rateLimit: { enabled: true, storage: "database" },
  plugins: [
    twoFactor({
      issuer: "williamulses.fr",
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 15 * 60,
      },
    }),
    passkey({ rpName: "William Ulses — admin", ...passkeyDomain }),
    nextCookies(), // Must remain last plugin
  ],
});
