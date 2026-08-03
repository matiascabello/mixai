import type { PersonaId } from "@/lib/openai/personas/registry";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequestBody = {
  messages: ChatMessage[];
  personaId: PersonaId;
  // Stable per browser chat session — lets a full conversation be filtered/followed
  // as one thread in the OpenAI dashboard's Logs view.
  conversationId: string;
};

export type ProposedSong = {
  title: string;
  artist: string;
};

export type ChatApiResponse =
  | { type: "message"; content: string; quickReplies: string[] }
  | { type: "proposal"; playlistName: string; songs: ProposedSong[] };
