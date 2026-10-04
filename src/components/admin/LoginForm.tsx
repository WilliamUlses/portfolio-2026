"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Separator } from "@/components/admin/ui/separator";
import { authClient } from "@/lib/auth-client";

// Admin authentication: passkey, or email + password followed by TOTP / backup code if 2FA is active.
type Step = "credentials" | "totp" | "backup";

const tooMany = "Trop de tentatives. Réessaie dans un moment.";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const done = () => {
    router.replace("/admin");
    router.refresh();
  };

  async function onCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) {
      // Generic error message to prevent user enumeration
      setError(error.status === 429 ? tooMany : "Identifiants incorrects.");
      return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      setStep("totp");
      return;
    }
    done();
  }

  async function onCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code")).trim();
    setPending(true);
    setError(null);
    const { error } =
      step === "totp"
        ? await authClient.twoFactor.verifyTotp({ code })
        : await authClient.twoFactor.verifyBackupCode({ code });
    setPending(false);
    if (error) {
      setError(
        error.status === 429
          ? tooMany
          : "code" in error && error.code === "ACCOUNT_TEMPORARILY_LOCKED"
            ? "Trop de codes faux : réessaie dans 15 minutes."
            : "Code incorrect ou expiré.",
      );
      return;
    }
    done();
  }

  async function onPasskey() {
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.passkey();
    setPending(false);
    if (error) {
      // User cancelled WebAuthn prompt: suppress error message
      if (!("code" in error && /CANCELLED/.test(error.code)))
        setError("Connexion par passkey impossible.");
      return;
    }
    done();
  }

  const feedback = error && (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  );

  if (step !== "credentials") {
    const totp = step === "totp";
    return (
      <form onSubmit={onCode} noValidate className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="code">
            {totp ? "Code de l'application" : "Code de secours"}
          </Label>
          <Input
            key={step}
            id="code"
            name="code"
            autoComplete="one-time-code"
            inputMode={totp ? "numeric" : "text"}
            pattern={totp ? "[0-9]{6}" : undefined}
            maxLength={totp ? 6 : 32}
            autoFocus
            required
          />
          <p className="text-xs text-muted-foreground">
            {totp
              ? "Les 6 chiffres affichés par votre application d'authentification."
              : "Un des codes de secours notés à l'activation (chacun ne sert qu'une fois)."}
          </p>
        </div>
        {feedback}
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Vérification…" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            setStep(totp ? "backup" : "totp");
          }}
        >
          {totp
            ? "Utiliser un code de secours"
            : "Utiliser le code de l'application"}
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={onPasskey}
      >
        Se connecter avec une passkey
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        ou
        <Separator className="flex-1" />
      </div>
      <form onSubmit={onCredentials} noValidate className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username webauthn"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {feedback}
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
