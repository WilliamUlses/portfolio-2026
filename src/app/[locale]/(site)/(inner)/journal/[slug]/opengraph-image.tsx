import { OG_SIZE } from "@/seo/og";
import { postCard } from "./post-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Journal — William Ulses";

export default function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  return postCard(params);
}
