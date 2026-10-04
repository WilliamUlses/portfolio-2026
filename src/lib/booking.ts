// Resolves booking URL from NEXT_PUBLIC_BOOKING_URL env variable.
// Returns null if booking link is not configured.

export function getBookingUrl(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  if (envUrl && envUrl.length > 0) {
    return envUrl;
  }
  return null;
}
