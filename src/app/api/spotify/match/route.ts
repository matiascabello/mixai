import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookies";
import { SpotifyAuthError, SpotifyRateLimitError } from "@/lib/spotify/client";
import { searchTracks } from "@/lib/spotify/search";
import type { ProposedSong } from "@/types/chat";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.spotify) {
    return NextResponse.json({ error: "Not logged into Spotify" }, { status: 401 });
  }

  const body = (await request.json()) as { songs?: ProposedSong[] };
  if (!Array.isArray(body.songs)) {
    return NextResponse.json({ error: "songs is required" }, { status: 400 });
  }

  try {
    // Matches are returned for immediate display only, never stored server-side.
    const matches = await searchTracks(session, body.songs);
    return NextResponse.json({ matches });
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
