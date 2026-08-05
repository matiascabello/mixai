import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import { sessionOptions, type SessionData } from "@/lib/session/cookies";

// Landing ("/") is the only page reachable while logged out — every other page
// requires a Spotify session, so bounce unauthenticated navigations back to it.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  if (!session.spotify) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!$|api|_next/static|_next/image|favicon.ico).*)"],
};
