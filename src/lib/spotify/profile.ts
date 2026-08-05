import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session/cookies";
import type { SpotifyProfile } from "@/types/spotify";
import { spotifyFetch } from "./client";

// display_name and images are returned without any extra scope beyond a valid
// user token; email/product/country would need user-read-email/user-read-private.
export async function getCurrentUserProfile(session: IronSession<SessionData>): Promise<SpotifyProfile> {
  const res = await spotifyFetch(session, "/me");

  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify profile: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    display_name: string | null;
    images?: { url: string }[];
  };

  return {
    displayName: data.display_name,
    avatarUrl: data.images?.[0]?.url,
  };
}
