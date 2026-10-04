import type { ActionResult } from "@/content/project-input";

// Field validation error message linked via aria-describedby.
export function FieldError({
  state,
  name,
}: {
  state: ActionResult<unknown> | null;
  name: string;
}) {
  const messages = state && !state.ok ? state.fieldErrors?.[name] : undefined;
  if (!messages?.length) return null;
  return (
    <p id={`${name}-error`} role="alert" className="text-xs text-destructive">
      {messages.join(", ")}
    </p>
  );
}

export function describedBy(state: ActionResult<unknown> | null, name: string) {
  return state && !state.ok && state.fieldErrors?.[name]
    ? `${name}-error`
    : undefined;
}
