// Generates standard iCalendar (.ics / RFC 5545) files and direct web calendar URLs.

function formatUtc(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function generateAppointmentIcs({
  id,
  name,
  email,
  topic,
  startTime,
  endTime,
  notes,
}: {
  id: number;
  name: string;
  email: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
}): string {
  const now = new Date();
  const uid = `appointment-${id}-${startTime.getTime()}@williamulses.fr`;
  const summary = `Rendez-vous · William Ulses & ${name}`;
  const description = [
    `Échange : ${topic}`,
    notes ? `Notes : ${notes}` : null,
    "Lien de visioconférence (Google Meet / Zoom) transmis en amont.",
    "Contact : contact@williamulses.fr",
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//William Ulses//Portfolio Native Booking//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(startTime)}`,
    `DTEND:${formatUtc(endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "LOCATION:Visioconférence (Google Meet / Zoom)",
    'ORGANIZER;CN="William Ulses":mailto:contact@williamulses.fr',
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${name}":mailto:${email}`,
    'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="William Ulses":mailto:williamulses78@gmail.com',
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Rappel rendez-vous William Ulses",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function getGoogleCalendarUrl({
  name,
  topic,
  startTime,
  endTime,
  notes,
}: {
  name: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
}): string {
  const title = encodeURIComponent(`Rendez-vous · William Ulses & ${name}`);
  const details = encodeURIComponent(
    `Échange : ${topic}\n${notes ? `Notes : ${notes}\n` : ""}Visioconférence Google Meet / Zoom\nContact : contact@williamulses.fr`,
  );
  const location = encodeURIComponent("Visioconférence (Google Meet / Zoom)");
  const dates = `${formatUtc(startTime)}/${formatUtc(endTime)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}
