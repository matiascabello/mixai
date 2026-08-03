import { NextResponse } from "next/server";
import { openai } from "@/lib/openai/client";
import { isPersonaId } from "@/lib/openai/personas/registry";
import { proposePlaylistTool, PROPOSE_PLAYLIST_TOOL_NAME } from "@/lib/openai/proposePlaylistTool";
import { buildSystemPrompt } from "@/lib/openai/systemPrompt";
import { getQuickReplies } from "@/lib/openai/suggestQuickRepliesTool";
import type { ChatApiResponse, ChatRequestBody, ProposedSong } from "@/types/chat";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatRequestBody>;

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }
  if (typeof body.personaId !== "string" || !isPersonaId(body.personaId)) {
    return NextResponse.json({ error: "a valid personaId is required" }, { status: 400 });
  }
  if (typeof body.conversationId !== "string" || !body.conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    messages: [{ role: "system", content: buildSystemPrompt(body.personaId) }, ...body.messages],
    tools: [proposePlaylistTool],
    tool_choice: "auto",
    // gpt-5.6 rejects function tools alongside its default reasoning_effort on this endpoint
    // (400: "Function tools with reasoning_effort are not supported ... /v1/chat/completions").
    reasoning_effort: "none",
    // Persists each call for inspection in the OpenAI dashboard (platform.openai.com/logs),
    // tagged so a full conversation can be filtered/followed as one thread.
    store: true,
    metadata: {
      personaId: body.personaId,
      conversationId: body.conversationId,
    },
  });

  const choice = completion.choices[0];
  const proposeCall = choice.message.tool_calls?.find(
    (call) => call.type === "function" && call.function.name === PROPOSE_PLAYLIST_TOOL_NAME,
  );

  if (proposeCall && proposeCall.type === "function") {
    const args = JSON.parse(proposeCall.function.arguments) as {
      playlistName: string;
      songs: ProposedSong[];
    };
    const response: ChatApiResponse = {
      type: "proposal",
      playlistName: args.playlistName,
      songs: args.songs,
    };
    return NextResponse.json(response);
  }

  const content = choice.message.content ?? "";
  const quickReplies = content ? await getQuickReplies(content) : [];

  const response: ChatApiResponse = {
    type: "message",
    content,
    quickReplies,
  };
  return NextResponse.json(response);
}
