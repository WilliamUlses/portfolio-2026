import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Rate limiting log for contact submissions: stores hashed client IP and timestamp.
// Entries older than 24h are periodically pruned. No message payload is stored.
export const contactAttempts = pgTable(
  "contact_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contact_attempts_ip_created_idx").on(t.ipHash, t.createdAt)],
);
