import { serializeJsonLd } from "@/seo/jsonld";

// Injects structured data script. Payload is safely sanitized by serializeJsonLd.
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized JSON-LD payload
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
