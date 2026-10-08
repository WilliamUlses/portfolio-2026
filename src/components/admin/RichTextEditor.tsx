"use client";

import {
  EditorContent,
  type JSONContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef, useState } from "react";
import type { z } from "zod";
import { Button } from "@/components/admin/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import type { TiptapDoc } from "@/content/blocks";
import { cn } from "@/lib/utils";

// Rich text editor: headings (H2/H3), bold, italic, links (https/mailto), bullet and ordered lists.
type Doc = z.infer<typeof TiptapDoc>;

const SAFE_LINK = /^(https:\/\/|mailto:)/i;

// Tiptap extension instance defined once to avoid re-instantiation on renders
const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    blockquote: false, // quotes use a dedicated block type
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: {
      openOnClick: false,
      autolink: false,
      protocols: ["mailto"],
      defaultProtocol: "https",
      isAllowedUri: (url) => SAFE_LINK.test(url.trim()),
    },
  }),
];

// Scoped styling for editable content area
const EDITOR_CLASS = cn(
  "min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed",
  "focus-visible:border-ring",
  "[&_h2]:mt-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_a]:text-(--color-glow) [&_a]:underline [&_a]:underline-offset-2",
);

export function RichTextEditor({
  id,
  label,
  value,
  lang,
  onChange,
}: {
  id: string;
  label: string;
  value: Doc;
  lang: string;
  onChange: (doc: Doc) => void;
}) {
  // Stable ref ensures onUpdate always dispatches to latest callback
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Fixed initial content to prevent cursor jumps on re-render
  const [initialContent] = useState(() => value as JSONContent);
  const editorProps = useMemo(
    () => ({
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        lang,
        class: EDITOR_CLASS,
      },
    }),
    [id, label, lang],
  );

  const editor = useEditor({
    // Avoid hydration mismatch with Next.js SSR
    immediatelyRender: false,
    extensions: EXTENSIONS,
    // Initial content parsed into Tiptap JSON schema
    content: initialContent,
    editorProps,
    onUpdate: ({ editor: e }) => onChangeRef.current(e.getJSON() as Doc),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      link: e?.isActive("link") ?? false,
      bullet: e?.isActive("bulletList") ?? false,
      ordered: e?.isActive("orderedList") ?? false,
    }),
  });

  // Link insertion modal dialog
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  if (!editor || !state)
    return (
      <p className="text-sm text-muted-foreground">Chargement de l'éditeur…</p>
    );

  const openLink = () => {
    setLinkUrl(
      (editor.getAttributes("link").href as string | undefined) ?? "https://",
    );
    setLinkError(null);
    setLinkOpen(true);
  };
  const applyLink = (event: React.FormEvent) => {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!SAFE_LINK.test(url)) {
      setLinkError("Seuls les liens https:// et mailto: sont autorisés.");
      return;
    }
    // Restore text selection in editor when setting link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkOpen(false);
  };
  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  };

  const tool = (
    text: string,
    active: boolean,
    action: () => void,
    title: string,
  ) => (
    <Button
      type="button"
      size="xs"
      variant={active ? "secondary" : "ghost"}
      aria-pressed={active}
      title={title}
      // Prevent button click from stealing focus so text selection is preserved
      onMouseDown={(e) => e.preventDefault()}
      onClick={action}
    >
      {text}
    </Button>
  );

  return (
    <div className="grid gap-1.5">
      <div
        role="toolbar"
        aria-label={`Mise en forme — ${label}`}
        className="flex flex-wrap gap-1"
      >
        {tool(
          "H2",
          state.h2,
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          "Titre de niveau 2",
        )}
        {tool(
          "H3",
          state.h3,
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          "Titre de niveau 3",
        )}
        {tool(
          "G",
          state.bold,
          () => editor.chain().focus().toggleBold().run(),
          "Gras (⌘B)",
        )}
        {tool(
          "I",
          state.italic,
          () => editor.chain().focus().toggleItalic().run(),
          "Italique (⌘I)",
        )}
        {tool("Lien", state.link, openLink, "Ajouter ou modifier un lien")}
        {tool(
          "• Liste",
          state.bullet,
          () => editor.chain().focus().toggleBulletList().run(),
          "Liste à puces",
        )}
        {tool(
          "1. Liste",
          state.ordered,
          () => editor.chain().focus().toggleOrderedList().run(),
          "Liste numérotée",
        )}
      </div>
      <EditorContent editor={editor} />

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <form onSubmit={applyLink} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Lien</DialogTitle>
              <DialogDescription>
                Adresse en https:// ou mailto: — appliquée au texte sélectionné.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-link`}>Adresse</Label>
              <Input
                id={`${id}-link`}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                aria-describedby={linkError ? `${id}-link-error` : undefined}
                autoFocus
              />
              {linkError && (
                <p
                  id={`${id}-link-error`}
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {linkError}
                </p>
              )}
            </div>
            <DialogFooter>
              {state.link && (
                <Button type="button" variant="ghost" onClick={removeLink}>
                  Retirer le lien
                </Button>
              )}
              <Button type="submit">Appliquer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
