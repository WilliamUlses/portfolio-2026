import { ProjectCreateForm } from "@/components/admin/ProjectCreateForm";

export default function NewProjectPage() {
  return (
    <main>
      <h1>Nouveau projet</h1>
      <p>Le projet est créé en brouillon ; le reste se remplit ensuite.</p>
      <ProjectCreateForm />
    </main>
  );
}
