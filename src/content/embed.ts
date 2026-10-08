import { EMBED_HOSTS } from "./blocks";

type Provider = keyof typeof EMBED_HOSTS;

// Converts public media URL to validated iframe embed URL; returns null if unrecognized.
export function embedSrc(provider: Provider, url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (
    u.protocol !== "https:" ||
    !(EMBED_HOSTS[provider] as readonly string[]).includes(u.hostname)
  ) {
    return null;
  }
  const id = (re: RegExp, s: string) => re.exec(s)?.[1] ?? null;
  switch (provider) {
    case "youtube": {
      const videoId =
        u.hostname === "youtu.be"
          ? id(/^\/([\w-]{11})$/, u.pathname)
          : (id(/^\/(?:embed|shorts)\/([\w-]{11})$/, u.pathname) ??
            (u.pathname === "/watch"
              ? id(/^([\w-]{11})$/, u.searchParams.get("v") ?? "")
              : null));
      return videoId
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : null;
    }
    case "vimeo": {
      const videoId = id(/^\/(?:video\/)?(\d+)$/, u.pathname);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    case "figma":
      return /^\/(file|design|proto)\//.test(u.pathname)
        ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
        : null;
  }
}
