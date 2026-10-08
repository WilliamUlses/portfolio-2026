import type { Metadata } from "next";
import { headers } from "next/headers";
import { AccountSecurity } from "@/components/admin/AccountSecurity";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/session";

// Admin account security: revalidates session on every request.
export const instant = false;

export const metadata: Metadata = { title: "Compte" };

// Account security management: passkeys, two-factor authentication, and active sessions.
export default async function AccountPage() {
  const { user, session } = await requireAdmin();
  const h = await headers();
  const [passkeys, sessions] = await Promise.all([
    auth.api.listPasskeys({ headers: h }),
    auth.api.listSessions({ headers: h }),
  ]);
  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compte</h1>
        <p className="text-sm text-muted-foreground">
          Sécurité de la connexion à l'admin ({user.email}).
        </p>
      </div>
      <AccountSecurity
        twoFactorEnabled={Boolean(user.twoFactorEnabled)}
        passkeys={passkeys.map((p) => ({
          id: p.id,
          name: p.name ?? null,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        }))}
        sessions={sessions.map((s) => ({
          token: s.token,
          current: s.id === session.id,
          userAgent: s.userAgent ?? null,
          createdAt: new Date(s.createdAt).toISOString(),
        }))}
      />
    </main>
  );
}
