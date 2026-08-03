import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookies";
import { exchangeCodeForTokens } from "@/lib/spotify/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const session = await getSession();
  const expectedState = session.oauthState;
  session.oauthState = undefined;

  if (error) {
    await session.save();
    return NextResponse.redirect(new URL(`/?spotify_error=${encodeURIComponent(error)}`, url.origin));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    await session.save();
    return NextResponse.redirect(new URL("/?spotify_error=invalid_state", url.origin));
  }

  const tokens = await exchangeCodeForTokens(code);

  session.spotify = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? "",
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
  await session.save();

  return NextResponse.redirect(new URL("/", url.origin));
}
