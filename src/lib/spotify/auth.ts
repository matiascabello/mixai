import type { SpotifyTokenResponse } from "@/types/spotify";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error(
    "SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REDIRECT_URI must be set (see .env.local.example)",
  );
}

// Minimum scopes needed to create a playlist for the logged-in user.
const SCOPES = ["playlist-modify-public", "playlist-modify-private"].join(" ");

function basicAuthHeader(): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId!,
    scope: SCOPES,
    redirect_uri: redirectUri!,
    state,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function requestToken(body: URLSearchParams): Promise<SpotifyTokenResponse> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as SpotifyTokenResponse;
}

export function exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri!,
    }),
  );
}

export function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  return requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}
