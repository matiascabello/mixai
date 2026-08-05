import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY must be set (see .env.local.example)");
}

export const openai = new OpenAI({ apiKey });

// Overridable per clone so people can tinker with other models without touching code.
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-5.6-terra";
export const QUICK_REPLY_MODEL = process.env.OPENAI_QUICK_REPLY_MODEL ?? "gpt-5.6-luna";
