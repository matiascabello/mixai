import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session/cookies";
import { spotifyFetch } from "./client";

export async function createPlaylist(
  session: IronSession<SessionData>,
  name: string,
): Promise<{ id: string; url: string }> {
  const res = await spotifyFetch(session, "/me/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, public: false }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create playlist: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { id: string; external_urls: { spotify: string } };
  return { id: data.id, url: data.external_urls.spotify };
}

// Uses /playlists/{playlist_id}/items, not the deprecated /tracks alias (see CLAUDE.md).
export async function addItemsToPlaylist(
  session: IronSession<SessionData>,
  playlistId: string,
  uris: string[],
): Promise<void> {
  const res = await spotifyFetch(session, `/playlists/${encodeURIComponent(playlistId)}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add tracks to playlist: ${res.status} ${await res.text()}`);
  }
}
