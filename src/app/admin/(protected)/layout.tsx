import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { requireAdmin } from "@/server/session";

// Admin navigations query session and database dynamically on every request without caching.
export const instant = false;

// Protected route barrier: requires authenticated admin session wrapped in Suspense for dynamic cookies.
async function AdminGate({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            William Ulses <span className="text-muted-foreground">· admin</span>
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </>
  );
}

export default function ProtectedLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-muted-foreground">
          Vérification de la session…
        </p>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
