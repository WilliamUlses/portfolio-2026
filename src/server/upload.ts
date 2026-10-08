import { issueSignedToken } from "@vercel/blob";
import {
  type HandleUploadPresignedBody,
  handleUploadPresigned,
} from "@vercel/blob/client";
import { blobStoreId, blobWebhookPublicKey } from "@/media/blob";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  MEDIA_PATHNAME_RE,
  UPLOAD_TOKEN_TTL_MS,
} from "@/media/constants";

// Presigned upload handler separated from the route handler for testability.
export async function presignedUpload(
  request: Request,
  body: HandleUploadPresignedBody,
) {
  return handleUploadPresigned({
    body,
    request,
    webhookPublicKey: blobWebhookPublicKey(),
    getSignedToken: async (pathname) => {
      if (!MEDIA_PATHNAME_RE.test(pathname)) {
        throw new Error(`Rejected pathname: ${pathname}`);
      }
      const token = await issueSignedToken({
        storeId: blobStoreId(),
        pathname,
        operations: ["put"],
        allowedContentTypes: [...ALLOWED_MIME],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        validUntil: Date.now() + UPLOAD_TOKEN_TTL_MS,
      });
      // addRandomSuffix: false ensures blob URL matches media pathname exactly
      return {
        token,
        urlOptions: { addRandomSuffix: false, allowOverwrite: false },
      };
    },
  });
}
