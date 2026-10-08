"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/admin/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      Se déconnecter
    </Button>
  );
}
