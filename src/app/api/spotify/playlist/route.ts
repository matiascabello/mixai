import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookies";
import { SpotifyAuthError, SpotifyRateLimitError } from "@/lib/spotify/client";
import { addItemsToPlaylist, createPlaylist } from "@/lib/spotify/playlist";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.spotify) {
    return NextResponse.json({ error: "Not logged into Spotify" }, { status: 401 });
  }

  const body = (await request.json()) as { playlistName?: string; trackUris?: string[] };
  if (!body.playlistName || !Array.isArray(body.trackUris) || body.trackUris.length === 0) {
    return NextResponse.json(
      { error: "playlistName and a non-empty trackUris array are required" },
      { status: 400 },
    );
  }

  try {
    const playlist = await createPlaylist(session, body.playlistName);
    await addItemsToPlaylist(session, playlist.id, body.trackUris);
    return NextResponse.json({ playlistId: playlist.id, playlistUrl: playlist.url });
  } catch (err) {
    if (err instanceof SpotifyAuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof SpotifyRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }
}
