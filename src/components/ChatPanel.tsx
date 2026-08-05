"use client";

import { useEffect, useRef, useState } from "react";
import { PERSONAS, type PersonaId } from "@/lib/openai/personas/registry";
import type { ChatApiResponse, ChatMessage, ChatRequestBody, ProposedSong } from "@/types/chat";

type ChatPanelProps = {
  personaId: PersonaId;
  onProposal: (playlistName: string, songs: ProposedSong[]) => void;
  disabled?: boolean;
  // Spotify matching happens right after a proposal, driven by the parent — shown here as
  // part of the conversation since it's the DJ persona's own action, not a separate app step.
  isMatching?: boolean;
};

// Generic event-type starters shown with the welcome message, so a user can kick off
// the conversation with a click instead of having to type a first message.
const WELCOME_QUICK_REPLIES = ["Birthday party", "Wedding", "Anniversary", "Just a fun get-together"];

function StatusRow({ avatarLetter, label }: { avatarLetter: string; label: string }) {
  return (
    <div className="chat-message-row chat-message-row--assistant">
      <span className="chat-avatar" aria-hidden="true">
        {avatarLetter}
      </span>
      <div className="chat-message chat-message--assistant chat-message--thinking">
        {label}
        <span className="thinking-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </div>
  );
}

export function ChatPanel({ personaId, onProposal, disabled, isMatching }: ChatPanelProps) {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi, I'm ${PERSONAS[personaId].displayName}, your DJ for the night. Tell me about the event you're planning — the occasion, the vibe, any songs or artists you love.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [quickReplies, setQuickReplies] = useState<string[]>(WELCOME_QUICK_REPLIES);
  const [isSending, setIsSending] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll only the internal message list, never the outer page — scrollIntoView() would
  // bubble up and drag the whole window's scroll position along with it.
  useEffect(() => {
    const el = chatMessagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isSending, quickReplies, isMatching]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setQuickReplies([]);
    const verbs = PERSONAS[personaId].thinkingVerbs;
    setThinkingLabel(verbs[Math.floor(Math.random() * verbs.length)]);
    setIsSending(true);
    setError(null);

    try {
      // Strip local-only rendering fields (playlistName/songs) before this goes over the
      // wire — the API only expects role/content per message.
      const requestBody: ChatRequestBody = {
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        personaId,
        conversationId,
      };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`Chat request failed (${res.status})`);
      }

      const data = (await res.json()) as ChatApiResponse;

      if (data.type === "proposal") {
        const summary = `Here's my proposal, "${data.playlistName}": ${data.songs
          .map((song) => `${song.title} — ${song.artist}`)
          .join(", ")}. Check the list below to confirm the Spotify matches.`;
        setMessages([
          ...nextMessages,
          { role: "assistant", content: summary, playlistName: data.playlistName, songs: data.songs },
        ]);
        onProposal(data.playlistName, data.songs);
      } else {
        setMessages([...nextMessages, { role: "assistant", content: data.content }]);
        setQuickReplies(data.quickReplies);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((message, index) => (
          <div key={index} className={`chat-message-row chat-message-row--${message.role}`}>
            {message.role === "assistant" && (
              <span className="chat-avatar" aria-hidden="true">
                {PERSONAS[personaId].displayName.charAt(0)}
              </span>
            )}
            <div className={`chat-message chat-message--${message.role}`}>
              {message.songs && message.songs.length > 0 ? (
                <>
                  <p className="chat-proposal-intro">
                    Here&rsquo;s my proposal, &ldquo;{message.playlistName}&rdquo;:
                  </p>
                  <ol className="chat-proposal-list">
                    {message.songs.map((song, songIndex) => (
                      <li key={songIndex}>
                        {song.title} — {song.artist}
                      </li>
                    ))}
                  </ol>
                  <p className="chat-proposal-outro">Check the list below to confirm the Spotify matches.</p>
                </>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {isSending && (
          <StatusRow avatarLetter={PERSONAS[personaId].displayName.charAt(0)} label={thinkingLabel} />
        )}
        {isMatching && (
          <StatusRow
            avatarLetter={PERSONAS[personaId].displayName.charAt(0)}
            label="Matching songs on Spotify"
          />
        )}
      </div>

      {error && <p className="chat-error">{error}</p>}

      {quickReplies.length > 0 && !isSending && (
        <div className="quick-replies">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              className="quick-reply-chip"
              disabled={disabled}
              onClick={() => void sendMessage(reply)}
            >
              {reply}
            </button>
          ))}
          <button
            type="button"
            className="quick-reply-chip quick-reply-chip--other"
            disabled={disabled}
            onClick={() => inputRef.current?.focus()}
          >
            Other…
          </button>
        </div>
      )}

      <form
        className="chat-input-row"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tell me about the party…"
          disabled={disabled || isSending}
        />
        <button type="submit" disabled={disabled || isSending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
