import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookies";
import { SpotifyAuthError, SpotifyRateLimitError } from "@/lib/spotify/client";
import { getCurrentUserProfile } from "@/lib/spotify/profile";

export async function GET() {
  const session = await getSession();
  if (!session.spotify) {
    return NextResponse.json({ error: "Not logged into Spotify" }, { status: 401 });
  }

  try {
    const profile = await getCurrentUserProfile(session);
    return NextResponse.json(profile);
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
