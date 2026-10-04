"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/admin",
    label: "Projets",
    match: (p: string) => p === "/admin" || p.startsWith("/admin/projets"),
  },
  {
    href: "/admin/medias",
    label: "Médiathèque",
    match: (p: string) => p.startsWith("/admin/medias"),
  },
  {
    href: "/admin/collaborateurs",
    label: "Collaborateurs",
    match: (p: string) => p.startsWith("/admin/collaborateurs"),
  },
  {
    href: "/admin/compte",
    label: "Compte",
    match: (p: string) => p.startsWith("/admin/compte"),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
