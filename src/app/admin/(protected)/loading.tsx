// Route loading boundary for admin navigations while fetching dynamic database queries
export default function AdminLoading() {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground">
      Chargement…
    </p>
  );
}
