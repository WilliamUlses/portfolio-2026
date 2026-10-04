import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";

export const metadata: Metadata = { title: "Connexion" };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 className="text-lg font-semibold">Connexion</h1>
          </CardTitle>
          <CardDescription>
            Espace d'administration du portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
