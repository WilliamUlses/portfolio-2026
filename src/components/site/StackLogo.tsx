import {
  Clapperboard,
  Cloud,
  Diamond,
  Layers,
  type LucideIcon,
  PenTool,
} from "lucide-react";
import type { StackPictogram, StackTool } from "@/content/stack";

// Stack tool icon renderer: SVG path from Simple Icons or functional Lucide pictogram fallback.
// Rendered decoratively alongside tool labels.

const PICTOGRAMS: Record<StackPictogram, LucideIcon> = {
  pen: PenTool,
  layers: Layers,
  keyframe: Diamond,
  clapper: Clapperboard,
  cloud: Cloud,
};

export function StackLogo({
  logo,
  pictogramClassName,
}: {
  logo: StackTool["logo"];
  pictogramClassName?: string;
}) {
  if (logo.kind === "pictogram") {
    const Icon = PICTOGRAMS[logo.pictogram];
    return (
      <Icon className={pictogramClassName} strokeWidth={1.6} aria-hidden />
    );
  }
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d={logo.path} />
    </svg>
  );
}
