import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { SpotifySession } from "@/types/spotify";

export type SessionData = {
  spotify?: SpotifySession;
  oauthState?: string;
};

const password = process.env.IRON_SESSION_PASSWORD;
if (!password || password.length < 32) {
  throw new Error(
    "IRON_SESSION_PASSWORD must be set to a random string of at least 32 characters (see .env.local.example)",
  );
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "dj_assistant_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
