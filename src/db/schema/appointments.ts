import {
  index,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "confirmed",
  "cancelled",
]);

export const appointmentTopicEnum = pgEnum("appointment_topic", [
  "job",
  "freelance",
  "exchange",
  "other",
]);

// Public appointments booked natively through the portfolio.
export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    topic: appointmentTopicEnum("topic").notNull().default("job"),
    notes: text("notes"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("appointments_start_idx").on(t.startTime),
    index("appointments_status_idx").on(t.status),
  ],
);

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
