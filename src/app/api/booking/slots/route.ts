import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/server/booking";

export async function GET() {
  try {
    const slots = await getAvailableSlots(14);
    return NextResponse.json(
      { slots },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    console.error("[api/booking/slots] Error fetching slots:", err);
    return NextResponse.json(
      { slots: [], error: "Failed to load slots" },
      { status: 500 },
    );
  }
}
