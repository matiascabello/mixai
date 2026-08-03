import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session/cookies";
import type { SpotifyTokenResponse } from "@/types/spotify";

vi.mock("./auth", () => ({
  refreshAccessToken: vi.fn(),
}));

import { refreshAccessToken } from "./auth";
import { SpotifyAuthError, SpotifyRateLimitError, spotifyFetch } from "./client";

type FakeSession = IronSession<SessionData> & { save: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> };

function fakeSession(spotify: SessionData["spotify"] | undefined): FakeSession {
  return {
    spotify,
    save: vi.fn(async () => {}),
    destroy: vi.fn(),
  } as unknown as FakeSession;
}

function loggedInSession(expiresAt = Date.now() + 1_000_000): FakeSession {
  return fakeSession({ accessToken: "old-access", refreshToken: "old-refresh", expiresAt });
}

function response(status: number, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name] ?? null },
  } as unknown as Response;
}

function tokenResponse(accessToken: string): SpotifyTokenResponse {
  return { access_token: accessToken, token_type: "Bearer", scope: "", expires_in: 3600 };
}

describe("spotifyFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects immediately when the session isn't logged into Spotify", async () => {
    await expect(spotifyFetch(fakeSession(undefined), "/me")).rejects.toBeInstanceOf(SpotifyAuthError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("makes a plain request with the current access token when nothing is expiring", async () => {
    const session = loggedInSession();
    vi.mocked(fetch).mockResolvedValueOnce(response(200));

    const res = await spotifyFetch(session, "/me");

    expect(res.status).toBe(200);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer old-access");
  });

  it("proactively refreshes a near-expiry token before the request", async () => {
    const session = loggedInSession(Date.now() - 1); // already past expiry
    vi.mocked(refreshAccessToken).mockResolvedValueOnce(tokenResponse("new-access"));
    vi.mocked(fetch).mockResolvedValueOnce(response(200));

    await spotifyFetch(session, "/me");

    expect(refreshAccessToken).toHaveBeenCalledWith("old-refresh");
    expect(session.save).toHaveBeenCalled();
    expect(session.spotify?.accessToken).toBe("new-access");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer new-access");
  });

  it("refreshes once and retries on a 401, then returns the retried response", async () => {
    const session = loggedInSession();
    vi.mocked(fetch).mockResolvedValueOnce(response(401)).mockResolvedValueOnce(response(200));
    vi.mocked(refreshAccessToken).mockResolvedValueOnce(tokenResponse("new-access"));

    const res = await spotifyFetch(session, "/me");

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("does not loop forever if the retried request is still a 401", async () => {
    const session = loggedInSession();
    vi.mocked(fetch).mockResolvedValue(response(401));
    vi.mocked(refreshAccessToken).mockResolvedValueOnce(tokenResponse("new-access"));

    const res = await spotifyFetch(session, "/me");

    expect(res.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("clears the session and throws when a refresh fails", async () => {
    const session = loggedInSession(Date.now() - 1);
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(new Error("invalid_grant"));

    await expect(spotifyFetch(session, "/me")).rejects.toBeInstanceOf(SpotifyAuthError);
    expect(session.destroy).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("backs off on 429s using Retry-After and eventually succeeds", async () => {
    vi.useFakeTimers();
    const session = loggedInSession();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(429, { "Retry-After": "1" }))
      .mockResolvedValueOnce(response(429, { "Retry-After": "2" }))
      .mockResolvedValueOnce(response(200));

    const resultPromise = spotifyFetch(session, "/search");
    await vi.runAllTimersAsync();
    const res = await resultPromise;

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("gives up after the max number of 429 retries", async () => {
    vi.useFakeTimers();
    const session = loggedInSession();
    vi.mocked(fetch).mockResolvedValue(response(429, { "Retry-After": "0" }));

    const resultPromise = spotifyFetch(session, "/search");
    const assertion = expect(resultPromise).rejects.toBeInstanceOf(SpotifyRateLimitError);
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetch).toHaveBeenCalledTimes(6); // 1 initial attempt + 5 retries
  });
});
