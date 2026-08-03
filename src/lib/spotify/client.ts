import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session/cookies";
import { refreshAccessToken } from "./auth";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const MAX_RATE_LIMIT_RETRIES = 5;
const REFRESH_MARGIN_MS = 60_000;

export class SpotifyAuthError extends Error {}
export class SpotifyRateLimitError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshSession(session: IronSession<SessionData>): Promise<void> {
  const spotify = session.spotify;
  if (!spotify) throw new SpotifyAuthError("Not logged into Spotify");

  try {
    const tokens = await refreshAccessToken(spotify.refreshToken);
    session.spotify = {
      ...spotify,
      accessToken: tokens.access_token,
      // Spotify may or may not rotate the refresh token; keep the old one if a new one isn't returned.
      refreshToken: tokens.refresh_token ?? spotify.refreshToken,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    await session.save();
  } catch {
    session.destroy();
    throw new SpotifyAuthError("Spotify session expired, please reconnect");
  }
}

// Shared request wrapper: proactively refreshes near-expiry tokens, retries once
// on a 401, and retries on 429 with Retry-After-driven exponential backoff.
export async function spotifyFetch(
  session: IronSession<SessionData>,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!session.spotify) throw new SpotifyAuthError("Not logged into Spotify");

  if (session.spotify.expiresAt - Date.now() < REFRESH_MARGIN_MS) {
    await refreshSession(session);
  }

  let attempt = 0;
  let hasRetriedOn401 = false;

  while (true) {
    const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${session.spotify!.accessToken}`,
      },
    });

    if (res.status === 429) {
      if (attempt >= MAX_RATE_LIMIT_RETRIES) {
        throw new SpotifyRateLimitError("Spotify rate limit exceeded after repeated retries");
      }
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 2 ** attempt;
      await sleep(retryAfterSeconds * 1000);
      attempt++;
      continue;
    }

    if (res.status === 401 && !hasRetriedOn401) {
      hasRetriedOn401 = true;
      await refreshSession(session);
      continue;
    }

    return res;
  }
}
