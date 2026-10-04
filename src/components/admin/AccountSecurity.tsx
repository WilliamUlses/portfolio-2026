"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { renderSVG } from "uqr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/admin/ui/alert-dialog";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { authClient } from "@/lib/auth-client";

// Account security management: passkeys, two-factor authentication, and active sessions.
// Actions dispatch via Better Auth client, followed by router.refresh to sync server state.

type PasskeyRow = { id: string; name: string | null; createdAt: string | null };
type SessionRow = {
  token: string;
  current: boolean;
  userAgent: string | null;
  createdAt: string;
};

const date = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

/** Parses browser and operating system heuristics from User-Agent string. */
function device(ua: string | null): string {
  if (!ua) return "Appareil inconnu";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Navigateur";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

/** Message lisible d'une erreur Better Auth. */
function failure(
  error: { status: number; message?: string } | null,
  fallback: string,
) {
  if (!error) return;
  toast.error(
    error.status === 429
      ? "Trop de tentatives. Réessaie dans un moment."
      : error.status === 400 || error.status === 401
        ? `${fallback} (mot de passe ou code incorrect ?)`
        : fallback,
  );
}

export function AccountSecurity({
  twoFactorEnabled,
  passkeys,
  sessions,
}: {
  twoFactorEnabled: boolean;
  passkeys: PasskeyRow[];
  sessions: SessionRow[];
}) {
  return (
    <>
      <Passkeys passkeys={passkeys} />
      <TwoFactor enabled={twoFactorEnabled} />
      <Sessions sessions={sessions} />
    </>
  );
}

// ── Passkeys ──────────────────────────────────────────────────────────────────
function Passkeys({ passkeys }: { passkeys: PasskeyRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");

  const add = () =>
    start(async () => {
      const { error } = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
      });
      if (error) {
        if (!("code" in error && /CANCELLED/.test(error.code)))
          toast.error(
            "Passkey non enregistrée (déjà présente sur cet appareil ?).",
          );
        return;
      }
      setName("");
      toast.success("Passkey enregistrée");
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) return void toast.error("Suppression impossible.");
      toast.success("Passkey supprimée");
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Connexion sans mot de passe, avec Touch ID, Face ID ou une clé de
          sécurité. Valables uniquement sur williamulses.fr (et localhost en
          local), pas sur les préversions Vercel.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {passkeys.length ? (
          <ul className="grid gap-2">
            {passkeys.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  {p.name || "Passkey sans nom"}
                  <span className="ml-2 text-muted-foreground">
                    ajoutée le {date(p.createdAt)}
                  </span>
                </span>
                <ConfirmButton
                  label="Supprimer"
                  title={`Supprimer « ${p.name || "cette passkey"} » ?`}
                  description="Elle ne permettra plus de se connecter."
                  disabled={pending}
                  onConfirm={() => remove(p.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune passkey pour l'instant.
          </p>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="passkey-name">Nom (facultatif)</Label>
            <Input
              id="passkey-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MacBook, iPhone…"
              maxLength={50}
            />
          </div>
          <Button type="button" disabled={pending} onClick={add}>
            {pending ? "En attente…" : "Ajouter une passkey"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Double authentification ───────────────────────────────────────────────────
type Setup = { uri: string; backupCodes: string[] };

function TwoFactor({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");

  const enable = () =>
    start(async () => {
      const { data, error } = await authClient.twoFactor.enable({
        password,
        method: "totp",
      });
      if (error || !data || data.method !== "totp")
        return failure(error, "Activation impossible");
      setPassword("");
      setSetup({ uri: data.totpURI, backupCodes: data.backupCodes });
    });

  const confirm = () =>
    start(async () => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
      });
      if (error) return failure(error, "Code refusé");
      setSetup(null);
      setCode("");
      toast.success("Double authentification activée");
      router.refresh();
    });

  const disable = () =>
    start(async () => {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) return failure(error, "Désactivation impossible");
      setPassword("");
      toast.success("Double authentification désactivée");
      router.refresh();
    });

  const regenerate = () =>
    start(async () => {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({
        password,
      });
      if (error || !data) return failure(error, "Codes non générés");
      setPassword("");
      setNewCodes(data.backupCodes);
      toast.success("Nouveaux codes de secours : les anciens ne marchent plus");
    });

  const passwordField = (
    <div className="grid gap-1.5">
      <Label htmlFor="twofa-password">Mot de passe</Label>
      <Input
        id="twofa-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Double authentification
          <Badge variant={enabled ? "default" : "outline"}>
            {enabled ? "Activée" : "Désactivée"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Après le mot de passe, un code à 6 chiffres de votre application
          d'authentification (1Password, Google Authenticator, Apps Mots de
          passe d'Apple…) est demandé. La connexion par passkey n'en a pas
          besoin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {setup ? (
          <div className="grid gap-4">
            <ol className="grid list-decimal gap-4 pl-5 text-sm">
              <li className="grid gap-2">
                Scannez ce QR code avec votre application d'authentification
                <div
                  className="size-44 rounded-md bg-white p-2"
                  role="img"
                  aria-label="QR code de configuration"
                  // SVG generated locally from TOTP URI by uqr
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized SVG string generated by uqr
                  dangerouslySetInnerHTML={{
                    __html: renderSVG(setup.uri, { border: 1 }),
                  }}
                />
                <span className="text-muted-foreground">
                  ou saisissez la clé :{" "}
                  <code className="break-all">
                    {new URL(setup.uri).searchParams.get("secret")}
                  </code>
                </span>
              </li>
              <li className="grid gap-2">
                Notez ces codes de secours en lieu sûr (chacun sert une fois, si
                vous perdez l'application) :
                <BackupCodes codes={setup.backupCodes} />
              </li>
              <li className="grid gap-2">
                <Label htmlFor="twofa-code">
                  Saisissez le code affiché pour confirmer
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="twofa-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="w-32"
                  />
                  <Button
                    type="button"
                    disabled={pending || code.trim().length !== 6}
                    onClick={confirm}
                  >
                    Confirmer
                  </Button>
                </div>
              </li>
            </ol>
          </div>
        ) : enabled ? (
          <div className="grid gap-4">
            {newCodes ? <BackupCodes codes={newCodes} /> : null}
            <div className="flex flex-wrap items-end gap-2">
              {passwordField}
              <Button
                type="button"
                variant="outline"
                disabled={pending || !password}
                onClick={regenerate}
              >
                Nouveaux codes de secours
              </Button>
              <ConfirmButton
                label="Désactiver"
                title="Désactiver la double authentification ?"
                description="Le mot de passe suffira de nouveau pour se connecter."
                disabled={pending || !password}
                onConfirm={disable}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            {passwordField}
            <Button
              type="button"
              disabled={pending || !password}
              onClick={enable}
            >
              {pending ? "Préparation…" : "Activer"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BackupCodes({ codes }: { codes: string[] }) {
  return (
    <div className="grid gap-2">
      <ul className="grid w-fit grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-border p-3 font-mono text-sm">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() =>
          navigator.clipboard
            .writeText(codes.join("\n"))
            .then(() => toast.success("Codes copiés"))
            .catch(() => toast.error("Copie impossible : notez-les à la main"))
        }
      >
        Copier les codes
      </Button>
    </div>
  );
}

// ── Sessions ──────────────────────────────────────────────────────────────────
function Sessions({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const revoke = (token: string) =>
    start(async () => {
      const { error } = await authClient.revokeSession({ token });
      if (error) return void toast.error("Déconnexion impossible.");
      toast.success("Session fermée");
      router.refresh();
    });
  const revokeOthers = () =>
    start(async () => {
      const { error } = await authClient.revokeOtherSessions();
      if (error) return void toast.error("Déconnexion impossible.");
      toast.success("Autres sessions fermées");
      router.refresh();
    });

  const others = sessions.filter((s) => !s.current).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions actives</CardTitle>
        <CardDescription>
          Les appareils connectés à l'admin (une session dure 7 jours).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul className="grid gap-2">
          {sessions.map((s) => (
            <li
              key={s.token}
              className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>
                {device(s.userAgent)}
                <span className="ml-2 text-muted-foreground">
                  depuis le {date(s.createdAt)}
                </span>
              </span>
              {s.current ? (
                <Badge variant="outline">Cet appareil</Badge>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => revoke(s.token)}
                >
                  Déconnecter
                </Button>
              )}
            </li>
          ))}
        </ul>
        {others ? (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={pending}
            onClick={revokeOthers}
          >
            Déconnecter les autres sessions ({others})
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConfirmButton({
  label,
  title,
  description,
  disabled,
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>{label}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
