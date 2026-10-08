import fs from "node:fs";
import path from "node:path";

// Returns downloadable CV URL if available, or null if no CV file is configured.
// Checks NEXT_PUBLIC_CV_URL environment variable first, then fallback to public/cv.pdf.

export function getCvUrl(): string | null {
  if (process.env.NEXT_PUBLIC_CV_URL?.trim()) {
    return process.env.NEXT_PUBLIC_CV_URL.trim();
  }
  try {
    const localFile = path.join(process.cwd(), "public", "cv.pdf");
    if (fs.existsSync(localFile)) {
      return "/cv.pdf";
    }
  } catch {
    // Filesystem access restricted or running in unsupported environment
  }
  return null;
}
