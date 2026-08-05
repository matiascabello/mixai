import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookies";
import { exchangeCodeForTokens } from "@/lib/spotify/auth";

// Built from the Host header rather than `new URL(request.url).origin` — in dev, Next's
// parsed request.url doesn't reliably echo back the host the client actually connected with
// (e.g. 127.0.0.1 vs localhost), which sends the browser to a host the session cookie isn't
// scoped to and strands it logged out. See CLAUDE.md's 127.0.0.1-only rule for why that split exists.
function requestOrigin(request: Request): string {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const origin = requestOrigin(request);

  const session = await getSession();
  const expectedState = session.oauthState;
  session.oauthState = undefined;

  if (error) {
    await session.save();
    return NextResponse.redirect(new URL(`/?spotify_error=${encodeURIComponent(error)}`, origin));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    await session.save();
    return NextResponse.redirect(new URL("/?spotify_error=invalid_state", origin));
  }

  const tokens = await exchangeCodeForTokens(code);

  session.spotify = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? "",
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
  await session.save();

  return NextResponse.redirect(new URL("/app", origin));
}
