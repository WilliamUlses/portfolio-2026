import { Badge } from "@/components/admin/ui/badge";
import { cn } from "@/lib/utils";

const STYLES = {
  draft: {
    label: "Brouillon",
    className: "border-border text-muted-foreground",
  },
  published: {
    label: "Publié",
    className: "border-transparent bg-success/15 text-success",
  },
  archived: {
    label: "Archivé",
    className: "border-border text-muted-foreground line-through",
  },
} as const;

// Project publication status badge (explicit text label, WCAG 1.4.1 compliant).
export function StatusBadge({ status }: { status: keyof typeof STYLES }) {
  const s = STYLES[status];
  return (
    <Badge variant="outline" className={cn(s.className)}>
      {s.label}
    </Badge>
  );
}
