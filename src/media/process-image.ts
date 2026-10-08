import { rgbaToThumbHash, thumbHashToAverageRGBA } from "thumbhash";
import { EXT_BY_MIME, IMAGE_MAX_EDGE } from "./constants";

// Browser-side image pre-processing: resizing, re-encoding (stripping EXIF/GPS),
// ThumbHash generation and dominant color extraction.
export type ProcessedImage = {
  file: Blob;
  mimeType: string;
  ext: string;
  width: number;
  height: number;
  thumbhash: string;
  dominantColor: string;
};

const toHex = (n: number) =>
  Math.round(n * 255)
    .toString(16)
    .padStart(2, "0");

function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function encode(
  canvas: OffscreenCanvas,
  keepPng: boolean,
): Promise<Blob> {
  // Preserve PNG if transparency is needed, otherwise encode to WebP (fallback to JPEG)
  if (keepPng) return canvas.convertToBlob({ type: "image/png" });
  const webp = await canvas.convertToBlob({ type: "image/webp", quality: 0.9 });
  if (webp.type === "image/webp") return webp;
  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 });
}

/**
 * Decodes image applying EXIF orientation, falling back to <img> decode when required.
 */
async function decode(source: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(source);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } catch {
      const heic =
        /hei[cf]$/i.test(source.type) || /\.hei[cf]$/i.test(source.name);
      throw new Error(
        heic
          ? "HEIC is not supported in this browser. Please use Safari or export as JPEG/PNG."
          : "Unsupported or unreadable image file.",
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Preprocesses an image before upload. */
export async function processImage(
  source: File,
  options: { opaque?: boolean } = {},
): Promise<ProcessedImage> {
  const bitmap = await decode(source);
  try {
    const size = fitWithin(bitmap.width, bitmap.height, IMAGE_MAX_EDGE);
    const canvas = new OffscreenCanvas(size.width, size.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D Canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    const file = await encode(
      canvas,
      source.type === "image/png" && !options.opaque,
    );

    const small = fitWithin(size.width, size.height, 100);
    const thumbCanvas = new OffscreenCanvas(small.width, small.height);
    const tctx = thumbCanvas.getContext("2d");
    if (!tctx) throw new Error("2D Canvas unavailable");
    tctx.drawImage(bitmap, 0, 0, small.width, small.height);
    const pixels = tctx.getImageData(0, 0, small.width, small.height).data;
    const hash = rgbaToThumbHash(small.width, small.height, pixels);
    const avg = thumbHashToAverageRGBA(hash);

    let binary = "";
    for (const byte of hash) binary += String.fromCharCode(byte);

    const ext = EXT_BY_MIME[file.type];
    if (!ext) throw new Error(`Unexpected output format: ${file.type}`);
    return {
      file,
      mimeType: file.type,
      ext,
      width: size.width,
      height: size.height,
      thumbhash: btoa(binary),
      dominantColor: `#${toHex(avg.r)}${toHex(avg.g)}${toHex(avg.b)}`,
    };
  } finally {
    bitmap.close();
  }
}
