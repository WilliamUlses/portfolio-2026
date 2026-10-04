// Resolves Vercel Blob credentials based on runtime environment (Production vs Preview/Dev).
function pick(
  suffix: "STORE_ID" | "WEBHOOK_PUBLIC_KEY",
  label: string,
): string {
  const prod = process.env[`BLOB_PROD_${suffix}`] || undefined;
  const preview = process.env[`BLOB_PREVIEW_${suffix}`] || undefined;
  if (prod && preview) {
    throw new Error(
      `Blob : BLOB_PROD_${suffix} et BLOB_PREVIEW_${suffix} présents ensemble.`,
    );
  }
  const value = prod ?? preview;
  if (!value) throw new Error(`Blob : variable BLOB_*_${suffix} manquante.`);
  if (process.env.VERCEL_ENV !== "production" && prod) {
    throw new Error(
      `Blob : ${label} de production hors environnement production.`,
    );
  }
  return value;
}

export const blobStoreId = (): string => pick("STORE_ID", "store");

/** Required by handleUploadPresigned callback verification */
export const blobWebhookPublicKey = (): string =>
  pick("WEBHOOK_PUBLIC_KEY", "webhook public key");
