import { POSTER_AT_SECONDS } from "./constants";

// Reads video metadata and extracts a poster frame in the browser
export type VideoInfo = {
  width: number;
  height: number;
  durationMs: number;
  poster: File;
};

function waitFor(video: HTMLVideoElement, event: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    video.addEventListener(event, () => resolve(), { once: true });
    video.addEventListener(
      "error",
      () => reject(new Error("Unable to read video in browser")),
      {
        once: true,
      },
    );
  });
}

export async function readVideo(source: File): Promise<VideoInfo> {
  const url = URL.createObjectURL(source);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    video.src = url;
    await waitFor(video, "loadedmetadata");
    const { videoWidth: width, videoHeight: height, duration } = video;
    if (!width || !height)
      throw new Error("Could not determine video dimensions");

    video.currentTime = Math.min(POSTER_AT_SECONDS, duration / 2);
    await waitFor(video, "seeked");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D Canvas unavailable");
    ctx.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/png"),
    );
    if (!blob) throw new Error("Could not extract video poster frame");

    const base = source.name.replace(/\.[^.]+$/, "");
    return {
      width,
      height,
      durationMs: Math.round(duration * 1000),
      poster: new File([blob], `${base}-poster.png`, { type: "image/png" }),
    };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
