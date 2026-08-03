// Client-safe: names/taglines only, no persona prose. Each persona's full character
// voice/backstory lives in the matching .md file in this directory and is only ever
// read server-side (see loadPersonaContent.ts) — never bundled to the client.

export const PERSONA_IDS = ["marcus-vinyl", "dj-pulse", "simone-laurent"] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

export type PersonaMeta = {
  displayName: string;
  tagline: string;
  // Short present-participle phrases shown (with animated dots) while a reply is loading.
  // One is picked at random per turn so the "thinking" state feels alive rather than static.
  thinkingVerbs: string[];
};

export const PERSONAS: Record<PersonaId, PersonaMeta> = {
  "marcus-vinyl": {
    displayName: 'Marcus "Vinyl" Reyes',
    tagline: "Warm, nostalgic block-party veteran",
    thinkingVerbs: [
      "Digging through the crates",
      "Flipping through records",
      "Thinking it over",
      "Finding the right groove",
    ],
  },
  "dj-pulse": {
    displayName: "DJ Pulse",
    tagline: "High-energy hype machine",
    thinkingVerbs: ["Cueing up", "Syncing the beat", "Building the drop", "Locked in"],
  },
  "simone-laurent": {
    displayName: "Simone Laurent",
    tagline: "Polished boutique-event curator",
    thinkingVerbs: [
      "Composing the arc",
      "Curating the selection",
      "Considering the pairing",
      "Refining the details",
    ],
  },
};

export function isPersonaId(value: string): value is PersonaId {
  return (PERSONA_IDS as readonly string[]).includes(value);
}
