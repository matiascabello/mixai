import type OpenAI from "openai";

export const PROPOSE_PLAYLIST_TOOL_NAME = "propose_playlist";

export const proposePlaylistTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: PROPOSE_PLAYLIST_TOOL_NAME,
    description:
      "Present the final proposed playlist to the user for approval, once enough information has been gathered.",
    parameters: {
      type: "object",
      properties: {
        playlistName: { type: "string", description: "A short, fitting name for the playlist." },
        songs: {
          type: "array",
          description: "The proposed songs, in the intended playback order.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              artist: { type: "string" },
            },
            required: ["title", "artist"],
            additionalProperties: false,
          },
        },
      },
      required: ["playlistName", "songs"],
      additionalProperties: false,
    },
  },
};
