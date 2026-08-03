import { loadPersonaContent } from "./personas/loadPersonaContent";
import type { PersonaId } from "./personas/registry";

// Shared across all personas — the task logic itself never changes, only the voice
// delivering it. Keep persona-specific content out of here; it lives in personas/*.md.
const DJ_TASK_INSTRUCTIONS = `Have a short conversation to understand the event: the occasion, the vibe, any reference
songs or artists the user shares, and roughly how many songs or how long the playlist should be.
Ask clarifying questions if any of that is missing before proposing anything. Ask ONE clarifying
question per turn, not several bundled together — it keeps the conversation easy to follow and lets
you offer focused quick-reply options for that specific question.

Once you have enough information, call the propose_playlist function with a concrete playlist
name and an ordered list of songs (title + artist). Order the songs deliberately according to
the event's needs (e.g. building energy over the night) unless the user asked for something else.
Do not describe the song list in plain text — always use the propose_playlist function to hand it off.

Only recommend real, well-known songs and artists. If you are not confident a song exists, do not
include it.`;

// Combines persona voice + task instructions into a single system message,
// per OpenAI's guidance to keep prompt builders as typed functions in app code.
export function buildSystemPrompt(personaId: PersonaId): string {
  const personaContent = loadPersonaContent(personaId);
  return `${personaContent}\n\n${DJ_TASK_INSTRUCTIONS}`;
}
