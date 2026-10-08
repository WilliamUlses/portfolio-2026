import { createId } from "@paralleldrive/cuid2";

// Generates unique random database identifiers using cuid2
export const newId = (): string => createId();
