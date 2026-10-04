import { Fragment, type ReactNode } from "react";
import type { z } from "zod";
import type { TiptapDoc } from "../blocks";

// Server-side renderer for validated Tiptap rich-text documents.
type Doc = z.infer<typeof TiptapDoc>;
type Node = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function renderText(node: Node): ReactNode {
  let out: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "link") {
      const href = String(mark.attrs?.href ?? "");
      const external = href.startsWith("https://");
      out = (
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {out}
        </a>
      );
    }
  }
  return out;
}

/** Function supplying the next H2 table-of-contents anchor ID */
type Anchor = () => string | undefined;

function renderNodes(nodes: Node[] | undefined, anchor?: Anchor): ReactNode[] {
  return (nodes ?? []).map((node, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: static parsed document tree
    <Fragment key={i}>{renderNode(node, anchor)}</Fragment>
  ));
}

function renderNode(node: Node, anchor?: Anchor): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node);
    case "hardBreak":
      return <br />;
    case "paragraph":
      return <p>{renderNodes(node.content)}</p>;
    case "heading":
      return node.attrs?.level === 3 ? (
        <h3>{renderNodes(node.content)}</h3>
      ) : (
        <h2 id={textLength(node) ? anchor?.() : undefined}>
          {renderNodes(node.content)}
        </h2>
      );
    case "bulletList":
      return <ul>{renderNodes(node.content)}</ul>;
    case "orderedList": {
      const start = node.attrs?.start;
      return (
        <ol start={typeof start === "number" ? start : undefined}>
          {renderNodes(node.content)}
        </ol>
      );
    }
    case "listItem":
      return <li>{renderNodes(node.content)}</li>;
    default:
      return null;
  }
}

// Empty H2 headings receive no anchor to match table-of-contents extraction
function textLength(node: Node): number {
  if (node.type === "text") return (node.text ?? "").trim().length;
  return (node.content ?? []).reduce((n, c) => n + textLength(c), 0);
}

export function RichText({ doc, anchor }: { doc: Doc; anchor?: Anchor }) {
  return <>{renderNodes(doc.content as Node[], anchor)}</>;
}
