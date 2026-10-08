import { gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { appointments } from "@/db/schema";
import { generateAppointmentIcs } from "@/server/ics";

// Live iCalendar feed of all portfolio appointments for Apple Calendar / Google Calendar subscription.
// William can subscribe to this URL once in Apple Calendar (File > New Calendar Subscription)
// so that every booking made on the storefront appears automatically on Mac and iPhone!
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Optional lightweight secret token check to avoid public indexing
  const validToken =
    process.env.CALENDAR_FEED_SECRET || "william-bookings-feed";
  if (token && token !== validToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Load upcoming and recent appointments (from 30 days ago to future)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await db
      .select()
      .from(appointments)
      .where(gte(appointments.startTime, thirtyDaysAgo));

    // Build standard multi-event iCalendar stream
    const eventsIcs = rows.map((app) => {
      return generateAppointmentIcs({
        id: app.id,
        name: app.name,
        email: app.email,
        topic: app.topic,
        startTime: app.startTime,
        endTime: app.endTime,
        notes: app.notes,
      })
        .replace(/^BEGIN:VCALENDAR[\s\S]*?BEGIN:VEVENT/, "BEGIN:VEVENT")
        .replace(/END:VEVENT[\s\S]*?END:VCALENDAR$/, "END:VEVENT");
    });

    const fullCalendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//William Ulses//Portfolio Bookings Feed//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Rendez-vous Portfolio William Ulses",
      "X-WR-TIMEZONE:Europe/Paris",
      "X-PUBLISHED-TTL:PT15M",
      "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
      ...eventsIcs,
      "END:VCALENDAR",
    ].join("\r\n");

    return new NextResponse(fullCalendar, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition":
          'inline; filename="william-portfolio-bookings.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw err;
    }
    console.error("[feed.ics] Error generating calendar feed:", err);
    return new NextResponse("Error generating calendar feed", { status: 500 });
  }
}
