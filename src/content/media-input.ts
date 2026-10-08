import { z } from "zod";
import "./zod-fr";
import {
  IMAGE_MIME,
  MAX_SVG_BYTES,
  MAX_UPLOAD_BYTES,
  MEDIA_PATHNAME_RE,
  SVG_MIME,
  VIDEO_MIME,
} from "@/media/constants";

const altText = z.string().trim().max(300);
const dimension = z.number().int().min(1).max(20000);
const thumbhash = z
  .string()
  .max(200)
  .regex(/^[A-Za-z0-9+/=]+$/);
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const common = {
  pathname: z.string().regex(MEDIA_PATHNAME_RE, "chemin invalide"),
  url: z.url({ protocol: /^https$/ }).refine((u) => {
    // Graceful handling to prevent uncaught exceptions on malformed URL parsing
    try {
      return new URL(u).hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, "URL hors du store Blob"),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  width: dimension,
  height: dimension,
  originalName: z.string().trim().max(255),
  altFr: altText,
  altEn: altText,
};

// Media registration input schema post-upload
export const RegisterMediaInput = z.discriminatedUnion("kind", [
  z.object({
    ...common,
    kind: z.literal("image"),
    mimeType: z.enum(IMAGE_MIME),
    thumbhash,
    dominantColor: color,
  }),
  z.object({
    ...common,
    kind: z.literal("svg"),
    mimeType: z.literal(SVG_MIME),
    fileSize: z.number().int().positive().max(MAX_SVG_BYTES),
  }),
  z.object({
    ...common,
    kind: z.literal("video"),
    mimeType: z.enum(VIDEO_MIME),
    durationMs: z
      .number()
      .int()
      .positive()
      .max(10 * 60 * 1000),
    posterMediaId: z.string().min(1),
  }),
]);
export type RegisterMediaInput = z.infer<typeof RegisterMediaInput>;

export const UpdateMediaAltInput = z.object({
  id: z.string().min(1),
  altFr: altText,
  altEn: altText,
});
