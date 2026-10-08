import { Block } from "./blocks";

// Public storefront block parser: invalid blocks are safely skipped and logged without breaking rendering.
export function readBlocks(
  raw: unknown,
  context: string,
  log: (message: string) => void = console.error,
): Block[] {
  if (!Array.isArray(raw)) {
    log(`[blocs] ${context} : liste attendue, reçu ${typeof raw}`);
    return [];
  }
  return raw.flatMap((item, index) => {
    const parsed = Block.safeParse(item);
    if (parsed.success) return [parsed.data];
    const type =
      typeof item === "object" && item && "type" in item
        ? String(item.type)
        : "?";
    log(
      `[blocs] ${context} : bloc ${index + 1} (${type}) ignoré — ${parsed.error.issues[0]?.message ?? "invalide"}`,
    );
    return [];
  });
}
