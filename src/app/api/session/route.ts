import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookies";

// Only reports whether a Spotify session exists. Tokens never leave the server.
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ loggedIn: Boolean(session.spotify) });
}
