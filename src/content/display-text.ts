// Display typography parser. Syntax: `*word*` marks bold/wide segment, `|` breaks lines.
export type DisplaySegment = { text: string; fat: boolean };
export type DisplayLine = DisplaySegment[];

export function parseDisplay(source: string): DisplayLine[] {
  return source.split("|").map((line) =>
    line
      .split(/(\*[^*]+\*)/)
      .filter((part) => part !== "")
      .map((part) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2
          ? { text: part.slice(1, -1), fat: true }
          : { text: part, fat: false },
      ),
  );
}

/** Plaintext conversion for accessibility and metadata. */
export function displayPlainText(source: string): string {
  return parseDisplay(source)
    .map((line) => line.map((s) => s.text).join(""))
    .join(" ");
}
