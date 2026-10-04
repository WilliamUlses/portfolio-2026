import { z } from "zod";
import "./zod-fr";

// Content block schemas.
const id = z.string().min(1);
const caption = z.string().max(280).optional();
const httpsUrl = z.url({ protocol: /^https$/ });

// Allowed hosts per embed provider for sandboxed iframes.
export const EMBED_HOSTS = {
  vimeo: ["vimeo.com", "player.vimeo.com"],
  youtube: [
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "www.youtube-nocookie.com",
  ],
  figma: ["figma.com", "www.figma.com"],
} as const;

// Strict Tiptap document schema:
// Allows paragraphs, H2/H3 headings, lists, hard breaks, bold, italic, and validated links.
// Unsupported nodes and attributes are stripped on save.
const LinkHref = z
  .string()
  .max(2000)
  .refine(
    (v) => /^(https:\/\/|mailto:)/i.test(v.trim()),
    "lien https: ou mailto: uniquement",
  );

const Mark = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({
    type: z.literal("link"),
    attrs: z.object({
      href: LinkHref,
      target: z.literal("_blank").nullable().optional(),
      rel: z.string().max(100).nullable().optional(),
    }),
  }),
]);

const Inline = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string().min(1).max(5000),
    marks: z.array(Mark).max(3).optional(),
  }),
  z.object({ type: z.literal("hardBreak") }),
]);

const Paragraph = z.object({
  type: z.literal("paragraph"),
  content: z.array(Inline).max(500).optional(),
});
const Heading = z.object({
  type: z.literal("heading"),
  attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }),
  content: z.array(Inline).max(100).optional(),
});

// Recursive lists schema using getters
const ListItem = z.object({
  type: z.literal("listItem"),
  get content() {
    return z
      .array(z.union([Paragraph, BulletList, OrderedList]))
      .min(1)
      .max(20);
  },
});
const BulletList: z.ZodType<{ type: "bulletList"; content: unknown[] }> =
  z.object({
    type: z.literal("bulletList"),
    get content() {
      return z.array(ListItem).min(1).max(100);
    },
  });
const OrderedList: z.ZodType<{
  type: "orderedList";
  attrs?: { start?: number };
  content: unknown[];
}> = z.object({
  type: z.literal("orderedList"),
  attrs: z
    .object({ start: z.number().int().min(0).max(10000).optional() })
    .optional(),
  get content() {
    return z.array(ListItem).min(1).max(100);
  },
});

export const TiptapDoc = z.object({
  type: z.literal("doc"),
  content: z
    .array(z.union([Paragraph, Heading, BulletList, OrderedList]))
    .max(200),
});

export const Block = z.discriminatedUnion("type", [
  z.object({
    id,
    type: z.literal("text"),
    doc: TiptapDoc,
    width: z.enum(["narrow", "wide"]).default("narrow"),
  }),
  z.object({
    id,
    type: z.literal("image"),
    mediaId: id,
    layout: z.enum(["full", "contained", "hero"]),
    caption,
  }),
  z.object({
    id,
    type: z.literal("gallery"),
    mediaIds: z.array(id).min(2).max(12),
    columns: z.union([z.literal(2), z.literal(3)]),
    caption,
  }),
  z.object({
    id,
    type: z.literal("video"),
    mediaId: id,
    autoplayLoop: z.boolean().default(true),
    caption,
  }),
  z.object({
    id,
    type: z.literal("quote"),
    text: z.string().max(600),
    author: z.string().optional(),
  }),
  z.object({
    id,
    type: z.literal("stats"),
    items: z
      .array(
        z.object({
          value: z.string().trim().min(1, "obligatoire").max(20),
          label: z.string().trim().min(1, "obligatoire").max(80),
        }),
      )
      .min(1)
      .max(4),
  }),
  z.object({
    id,
    type: z.literal("credits"),
    items: z
      .array(
        z.object({
          role: z.string().trim().min(1, "obligatoire").max(80),
          name: z.string().trim().min(1, "obligatoire").max(120),
          url: httpsUrl.optional(),
        }),
      )
      .max(30),
  }),
  z
    .object({
      id,
      type: z.literal("embed"),
      provider: z.enum(["vimeo", "youtube", "figma"]),
      url: httpsUrl,
    })
    .refine(
      (b) => {
        // Protect against malformed URLs throwing unhandled exceptions during refinement
        try {
          return (EMBED_HOSTS[b.provider] as readonly string[]).includes(
            new URL(b.url).hostname,
          );
        } catch {
          return false;
        }
      },
      { message: "l'URL ne correspond pas au fournisseur", path: ["url"] },
    ),
]);

export type Block = z.infer<typeof Block>;
export const Blocks = z.array(Block).max(80);
export type BlockType = Block["type"];

/** Referenced media IDs within blocks paired with expected media kinds. */
export type MediaRef = { id: string; expects: "image" | "video" };

export function mediaRefs(blocks: Block[]): MediaRef[] {
  return blocks.flatMap((b): MediaRef[] => {
    if (b.type === "image") return [{ id: b.mediaId, expects: "image" }];
    if (b.type === "gallery") {
      return b.mediaIds.map((id) => ({ id, expects: "image" }));
    }
    if (b.type === "video") return [{ id: b.mediaId, expects: "video" }];
    return [];
  });
}
