export const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export const SVG_MIME = "image/svg+xml";
export const VIDEO_MIME = ["video/mp4", "video/webm"] as const;

// Stored MIME types validated by the server
export const ALLOWED_MIME: readonly string[] = [
  ...IMAGE_MIME,
  SVG_MIME,
  ...VIDEO_MIME,
];

// iPhone formats accepted in client input, converted to WebP/JPEG before upload
export const HEIC_MIME = ["image/heic", "image/heif"] as const;
export const INPUT_MIME: readonly string[] = [...ALLOWED_MIME, ...HEIC_MIME];

export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;
export const MAX_SVG_BYTES = 2 * 1024 * 1024;
export const MULTIPART_THRESHOLD_BYTES = 16 * 1024 * 1024;
export const IMAGE_MAX_EDGE = 3000;
export const COVER_MIN_WIDTH = 1200;
export const POSTER_AT_SECONDS = 0.5;
export const UPLOAD_TOKEN_TTL_MS = 10 * 60 * 1000;

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

// Client-generated path pattern verified server-side: media/<cuid2>.<ext>
export const MEDIA_PATHNAME_RE =
  /^media\/[a-z0-9]{20,32}\.(jpg|png|webp|avif|svg|mp4|webm)$/;
