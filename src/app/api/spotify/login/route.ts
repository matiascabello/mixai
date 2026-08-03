import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookies";
import { buildAuthorizeUrl } from "@/lib/spotify/auth";

export async function GET() {
  const session = await getSession();
  const state = randomBytes(16).toString("hex");
  session.oauthState = state;
  await session.save();

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
