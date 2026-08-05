import type { PersonaId } from "@/lib/openai/personas/registry";

export type ProposedSong = {
  title: string;
  artist: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  // Present only on a proposal-summary message — lets the UI render the tracklist as a
  // real list instead of parsing it back out of `content` (which stays plain text for
  // replaying conversation history to the API).
  playlistName?: string;
  songs?: ProposedSong[];
};

export type ChatRequestBody = {
  messages: ChatMessage[];
  personaId: PersonaId;
  // Stable per browser chat session — lets a full conversation be filtered/followed
  // as one thread in the OpenAI dashboard's Logs view.
  conversationId: string;
};

export type ChatApiResponse =
  | { type: "message"; content: string; quickReplies: string[] }
  | { type: "proposal"; playlistName: string; songs: ProposedSong[] };
