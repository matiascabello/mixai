import type OpenAI from "openai";
import { openai } from "./client";

const SUGGEST_QUICK_REPLIES_TOOL_NAME = "suggest_quick_replies";

const suggestQuickRepliesTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: SUGGEST_QUICK_REPLIES_TOOL_NAME,
    description: "Suggest 2-4 short quick-reply options tailored to the question just asked.",
    parameters: {
      type: "object",
      properties: {
        replies: {
          type: "array",
          description:
            "2-4 short reply options (a few words each), tailored to the question just asked. " +
            "Empty array if the question is open-ended and canned options wouldn't be useful.",
          items: { type: "string" },
        },
      },
      required: ["replies"],
      additionalProperties: false,
    },
  },
};

const CLASSIFIER_SYSTEM_PROMPT =
  "You look at a single chat message from a DJ assistant to a user and decide whether it asks a " +
  "clarifying question with a small, concrete set of plausible answers (e.g. playlist length, " +
  "overall vibe, whether to include a specific genre). Call suggest_quick_replies with 2-4 short " +
  "options tailored to that exact question. If the message is open-ended (e.g. asking for reference " +
  "songs/artists), isn't really a question, or is a closing statement, call suggest_quick_replies " +
  "with an empty replies array.";

// Deliberately a separate, forced-tool-choice call rather than a second tool on the main chat
// completion: gpt-4o reliably won't combine a text reply with a "decorative" parallel tool call
// under tool_choice "auto" (confirmed empirically), but forcing a dedicated call to this single
// function is reliable. Runs on a cheap/fast model since it's a narrow classification task.
export async function getQuickReplies(assistantMessage: string): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.6-luna",
    messages: [
      { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
      { role: "user", content: assistantMessage },
    ],
    tools: [suggestQuickRepliesTool],
    tool_choice: { type: "function", function: { name: SUGGEST_QUICK_REPLIES_TOOL_NAME } },
    // gpt-5.6 rejects function tools alongside its default reasoning_effort on this endpoint.
    reasoning_effort: "none",
  });

  const call = completion.choices[0].message.tool_calls?.[0];
  if (!call || call.type !== "function") return [];

  const args = JSON.parse(call.function.arguments) as { replies: string[] };
  return args.replies;
}
