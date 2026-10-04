import type { Metadata } from "next";
import { connection } from "next/server";
import { PeopleList } from "@/components/admin/PeopleList";
import { PersonForm } from "@/components/admin/PersonForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { listMediaOptions } from "@/server/admin/media";
import { listPeople } from "@/server/admin/people";

// Admin directory: real-time database queries on navigation.
export const instant = false;

export const metadata: Metadata = { title: "Collaborateurs" };

// Global collaborator directory: individuals are defined once here, then attached to projects with localized roles.
export default async function PeoplePage() {
  // Opt in to dynamic rendering per request
  await connection();
  const [people, media] = await Promise.all([listPeople(), listMediaOptions()]);
  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Collaborateurs
        </h1>
        <p className="text-sm text-muted-foreground">
          Les personnes avec qui vous avez travaillé. Ajoutez-les ensuite à un
          projet depuis sa page, avec leur rôle.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un collaborateur</CardTitle>
          <CardDescription>
            Liens facultatifs, en https. Sans photo, ses initiales sont
            affichées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonForm media={media} />
        </CardContent>
      </Card>
      <PeopleList people={people} media={media} />
    </main>
  );
}
