// Lightweight parser for iCalendar (.ics / RFC 5545) feeds.
// Extracts busy time intervals to dynamically eliminate overlapping booking slots.

export interface TimeInterval {
  start: Date;
  end: Date;
}

/**
 * Parses iCalendar date strings:
 * - 20261005T093000Z (UTC)
 * - 20261005T113000 (Local / floating)
 * - 20261005 (All day)
 */
export function parseIcsDate(raw: string): Date | null {
  const cleaned = raw.trim();
  // Strip any leading parameters like TZID=Europe/Paris:
  const val = cleaned.includes(":")
    ? (cleaned.split(":").pop() ?? cleaned)
    : cleaned;

  // Format: YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
  const dateTimeMatch = val.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/,
  );
  if (dateTimeMatch) {
    const y = Number(dateTimeMatch[1]);
    const m = Number(dateTimeMatch[2]);
    const d = Number(dateTimeMatch[3]);
    const hh = Number(dateTimeMatch[4]);
    const mm = Number(dateTimeMatch[5]);
    const ss = Number(dateTimeMatch[6]);
    const isUtc = Boolean(dateTimeMatch[7]);

    if (isUtc) {
      return new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
    }
    return new Date(y, m - 1, d, hh, mm, ss);
  }

  // Format: YYYYMMDD (All day event)
  const dateMatch = val.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateMatch) {
    const y = Number(dateMatch[1]);
    const m = Number(dateMatch[2]);
    const d = Number(dateMatch[3]);
    return new Date(y, m - 1, d, 0, 0, 0);
  }

  return null;
}

export function parseIcsBusyIntervals(icsContent: string): TimeInterval[] {
  const intervals: TimeInterval[] = [];
  const lines = icsContent.replace(/\r\n/g, "\n").split("\n");

  let inEvent = false;
  let currentStart: Date | null = null;
  let currentEnd: Date | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      currentStart = null;
      currentEnd = null;
      continue;
    }

    if (line.startsWith("END:VEVENT")) {
      if (inEvent && currentStart) {
        // If no end time, default to 1 hour after start
        const end =
          currentEnd ?? new Date(currentStart.getTime() + 60 * 60 * 1000);
        intervals.push({ start: currentStart, end });
      }
      inEvent = false;
      currentStart = null;
      currentEnd = null;
      continue;
    }

    if (!inEvent) continue;

    if (line.startsWith("DTSTART")) {
      currentStart = parseIcsDate(line);
    } else if (line.startsWith("DTEND")) {
      currentEnd = parseIcsDate(line);
    }
  }

  return intervals;
}

export async function fetchCalendarBusyIntervals(): Promise<TimeInterval[]> {
  const url = process.env.CALENDAR_FEED_URL?.trim();
  if (!url) return [];

  try {
    const httpUrl = url.replace(/^webcal:\/\//i, "https://");
    const res = await fetch(httpUrl, {
      next: { revalidate: 300 }, // Cache 5 min
    });

    if (!res.ok) {
      console.warn(
        `[calendar] Failed to fetch calendar feed: HTTP ${res.status}`,
      );
      return [];
    }

    const text = await res.text();
    return parseIcsBusyIntervals(text);
  } catch (err) {
    console.error("[calendar] Error fetching calendar feed:", err);
    return [];
  }
}
