import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { appointments } from "@/db/schema";
import { fetchCalendarBusyIntervals, type TimeInterval } from "./calendar";

export interface BookingSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (e.g. "10:30")
  startIso: string;
  endIso: string;
}

// Working hours (Paris local time)
const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 30;
const WORK_END_HOUR = 18;
const WORK_END_MINUTE = 30;
const SLOT_DURATION_MINUTES = 30;

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableSlots(
  daysAhead = 14,
): Promise<BookingSlot[]> {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ); // Start tomorrow
  const endDate = new Date(
    startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000,
  );

  // 1. Fetch busy intervals from live iCal calendar feed
  const calendarBusy = await fetchCalendarBusyIntervals();

  // 2. Fetch already confirmed appointments from Neon DB in this date range
  let dbAppointments: { startTime: Date; endTime: Date }[] = [];
  try {
    dbAppointments = await db
      .select({
        startTime: appointments.startTime,
        endTime: appointments.endTime,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "confirmed"),
          gte(appointments.startTime, startDate),
          lte(appointments.endTime, endDate),
        ),
      );
  } catch (err) {
    console.error("[booking] Error querying appointments:", err);
  }

  const allBusyIntervals: TimeInterval[] = [
    ...calendarBusy,
    ...dbAppointments.map((a) => ({ start: a.startTime, end: a.endTime })),
  ];

  const slots: BookingSlot[] = [];

  // Generate candidate slots for each business day
  const cur = new Date(startDate);
  while (cur < endDate) {
    if (!isWeekend(cur)) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const d = cur.getDate();
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      let slotStart = new Date(y, m, d, WORK_START_HOUR, WORK_START_MINUTE);
      const dayEnd = new Date(y, m, d, WORK_END_HOUR, WORK_END_MINUTE);

      while (
        slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000 <=
        dayEnd.getTime()
      ) {
        const slotEnd = new Date(
          slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000,
        );

        // Check if overlaps with any busy interval
        const isBusy = allBusyIntervals.some((b) =>
          intervalsOverlap(slotStart, slotEnd, b.start, b.end),
        );

        if (!isBusy) {
          const hh = String(slotStart.getHours()).padStart(2, "0");
          const mm = String(slotStart.getMinutes()).padStart(2, "0");
          slots.push({
            date: dateStr,
            time: `${hh}:${mm}`,
            startIso: slotStart.toISOString(),
            endIso: slotEnd.toISOString(),
          });
        }

        // Advance by slot duration
        slotStart = new Date(
          slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000,
        );
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  return slots;
}
