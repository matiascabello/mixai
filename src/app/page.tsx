"use client";

import { useEffect, useState } from "react";
import { AccountBadge } from "@/components/AccountBadge";
import { ChatPanel } from "@/components/ChatPanel";
import { PersonaPicker } from "@/components/PersonaPicker";
import { PlaylistEmbed } from "@/components/PlaylistEmbed";
import { StepIndicator } from "@/components/StepIndicator";
import { TrackConfirmationList } from "@/components/TrackConfirmationList";
import type { PersonaId } from "@/lib/openai/personas/registry";
import type { ProposedSong } from "@/types/chat";
import type { MatchedTrack } from "@/types/spotify";

type ProposalState = {
  playlistName: string;
  tracks: MatchedTrack[];
} | null;

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [personaId, setPersonaId] = useState<PersonaId | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [proposal, setProposal] = useState<ProposalState>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which half of the chat/confirm step is visible. ChatPanel itself stays mounted at all
  // times (see render below) so its conversation history survives switching away and back.
  const [activePanel, setActivePanel] = useState<"chat" | "tracks">("chat");

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { loggedIn: boolean }) => setLoggedIn(data.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  async function handleProposal(playlistName: string, songs: ProposedSong[]) {
    setIsMatching(true);
    setError(null);
    try {
      const res = await fetch("/api/spotify/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songs }),
      });
      if (!res.ok) {
        throw new Error(`Matching songs on Spotify failed (${res.status})`);
      }
      const data = (await res.json()) as { matches: MatchedTrack[] };
      setProposal({ playlistName, tracks: data.matches });
      setActivePanel("tracks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to match songs on Spotify");
    } finally {
      setIsMatching(false);
    }
  }

  async function handleCreatePlaylist(playlistName: string, trackUris: string[]) {
    setIsCreatingPlaylist(true);
    setError(null);
    try {
      const res = await fetch("/api/spotify/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistName, trackUris }),
      });
      if (!res.ok) {
        throw new Error(`Creating the playlist failed (${res.status})`);
      }
      const data = (await res.json()) as { playlistId: string };
      setPlaylistId(data.playlistId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the playlist");
    } finally {
      setIsCreatingPlaylist(false);
    }
  }

  const currentStep = !loggedIn ? 1 : !personaId ? 2 : playlistId ? 5 : proposal ? 4 : 3;

  function handleLoggedOut() {
    setLoggedIn(false);
    setPersonaId(null);
    setProposal(null);
    setPlaylistId(null);
    setActivePanel("chat");
    setError(null);
  }

  return (
    <main className="page">
      <div className="top-bar">
        <div>
          <p className="eyebrow">Tonight&rsquo;s lineup</p>
          <h1>
            Mix<span className="accent-text">AI</span>
          </h1>
          <p className="tagline">Describe the vibe. It builds the set.</p>
        </div>
        {loggedIn === true && <AccountBadge onLoggedOut={handleLoggedOut} />}
      </div>
      <StepIndicator currentStep={currentStep} />

      {loggedIn === null && <p>Checking Spotify connection…</p>}

      {loggedIn === false && (
        <div className="login-gate">
          <p>Connect your Spotify account to build a playlist together.</p>
          <a className="button" href="/api/spotify/login">
            Connect Spotify
          </a>
        </div>
      )}

      {loggedIn === true && !personaId && <PersonaPicker onSelect={setPersonaId} />}

      {loggedIn === true && personaId && !playlistId && (
        <div className="workspace">
          {proposal && (
            <div className="panel-tabs">
              <button
                type="button"
                className={`panel-tab${activePanel === "chat" ? " panel-tab--active" : ""}`}
                onClick={() => setActivePanel("chat")}
              >
                Chat
              </button>
              <button
                type="button"
                className={`panel-tab${activePanel === "tracks" ? " panel-tab--active" : ""}`}
                onClick={() => setActivePanel("tracks")}
              >
                Confirm tracks
              </button>
            </div>
          )}

          <div className={activePanel === "chat" ? undefined : "is-hidden"}>
            {proposal && (
              <p className="refine-hint">
                Tell your DJ what to change, then switch to <strong>Confirm tracks</strong> to see the
                updated list.
              </p>
            )}
            <ChatPanel
              personaId={personaId}
              onProposal={handleProposal}
              disabled={isMatching}
              isMatching={isMatching}
            />
          </div>

          {proposal && activePanel === "tracks" && (
            <TrackConfirmationList
              playlistName={proposal.playlistName}
              tracks={proposal.tracks}
              onCreatePlaylist={handleCreatePlaylist}
              isCreating={isCreatingPlaylist}
            />
          )}
        </div>
      )}

      {playlistId && proposal && personaId && (
        <div className="result">
          <PlaylistEmbed playlistId={playlistId} playlistName={proposal.playlistName} personaId={personaId} />
        </div>
      )}

      {error && <p className="page-error">{error}</p>}
    </main>
  );
}
