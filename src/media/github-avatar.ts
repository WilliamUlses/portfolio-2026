import { put } from "@vercel/blob";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";
import { githubLogin } from "@/content/people-input";
import { newId } from "@/lib/ids";
import { blobStoreId } from "./blob";

// Fetch and mirror GitHub public avatar to Vercel Blob to avoid external runtime dependency and CSP drift.
const SIZE = 460;
const MAX_BYTES = 5 * 1024 * 1024;

export type GithubAvatar = {
  id: string;
  url: string;
  pathname: string;
  fileSize: number;
  width: number;
  height: number;
  thumbhash: string;
  dominantColor: string;
  originalName: string;
};

export class GithubAvatarError extends Error {}

/** Downloads the GitHub avatar, converts to WebP, and uploads to Blob storage without DB write. */
export async function fetchGithubAvatar(
  profileUrl: string,
): Promise<GithubAvatar> {
  const login = githubLogin(profileUrl);
  if (!login) throw new GithubAvatarError("Lien GitHub invalide.");

  let res: Response;
  try {
    res = await fetch(`https://github.com/${login}.png?size=${SIZE}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new GithubAvatarError("GitHub ne répond pas, réessayez.");
  }
  if (res.status === 404)
    throw new GithubAvatarError(`Compte GitHub « ${login} » introuvable.`);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/"))
    throw new GithubAvatarError("Photo GitHub indisponible.");
  const source = Buffer.from(await res.arrayBuffer());
  if (source.length > MAX_BYTES)
    throw new GithubAvatarError("Photo GitHub trop lourde.");

  const image = sharp(source).rotate();
  const file = await image
    .clone()
    .resize(SIZE, SIZE, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  // ThumbHash computed on thumbnail <= 100px
  const small = await image
    .clone()
    .resize(100, 100, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const hash = rgbaToThumbHash(small.info.width, small.info.height, small.data);
  const { dominant } = await image.stats();
  const hex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();

  const id = newId();
  const blob = await put(`media/${id}.webp`, file.data, {
    access: "public",
    contentType: "image/webp",
    storeId: blobStoreId(),
  });
  return {
    id,
    url: blob.url,
    pathname: blob.pathname,
    fileSize: file.data.length,
    width: file.info.width,
    height: file.info.height,
    thumbhash: Buffer.from(hash).toString("base64"),
    dominantColor: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`,
    originalName: `github-${login}.webp`,
  };
}
