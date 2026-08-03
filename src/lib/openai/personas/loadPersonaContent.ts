import { readFileSync } from "fs";
import path from "path";
import type { PersonaId } from "./registry";

// Server-only (uses fs). Never import this from a client component.
export function loadPersonaContent(id: PersonaId): string {
  const filePath = path.join(process.cwd(), "src/lib/openai/personas", `${id}.md`);
  return readFileSync(filePath, "utf-8").trim();
}
