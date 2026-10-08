import type { HandleUploadPresignedBody } from "@vercel/blob/client";
import { getAdminSession } from "@/server/session";
import { presignedUpload } from "@/server/upload";

// Direct browser-to-Blob presigned upload handler.
// Tokens are restricted to a single path, write-only, validated content types, 60MB max, 10 min expiry.
export async function POST(request: Request): Promise<Response> {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as HandleUploadPresignedBody;
    return Response.json(await presignedUpload(request, body));
  } catch (err) {
    // Logged on server for debugging client upload errors
    console.error("[api/upload]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload rejected" },
      { status: 400 },
    );
  }
}
