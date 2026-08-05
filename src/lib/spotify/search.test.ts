import { describe, expect, it, vi } from "vitest";
import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session/cookies";
import { MIN_MATCH_SCORE, normalize, scoreCandidate, searchTracks, type SpotifyTrackItem } from "./search";

vi.mock("./client", () => ({
  spotifyFetch: vi.fn(),
}));

import { spotifyFetch } from "./client";

function track(name: string, artistNames: string[]): SpotifyTrackItem {
  return {
    uri: `spotify:track:${name}`,
    name,
    artists: artistNames.map((n) => ({ name: n })),
    album: { name: "Album", images: [{ url: "https://example.com/art.jpg" }] },
    duration_ms: 200000,
  };
}

function fakeSession(): IronSession<SessionData> {
  return { spotify: { accessToken: "a", refreshToken: "r", expiresAt: Date.now() + 1e6 } } as unknown as IronSession<SessionData>;
}

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

describe("normalize", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalize("Stayin' Alive")).toBe("stayin alive");
  });

  it("strips curly quotes the same as straight ones", () => {
    expect(normalize("Stayin’ Alive")).toBe(normalize("Stayin' Alive"));
  });

  it("strips diacritics", () => {
    expect(normalize("Café")).toBe("cafe");
  });

  it("strips parenthetical suffixes", () => {
    expect(normalize("Night Fever (Remastered 2007)")).toBe("night fever");
  });
});

describe("scoreCandidate", () => {
  it("scores an exact title and artist match highest", () => {
    const score = scoreCandidate("Stayin' Alive", "Bee Gees", track("Stayin' Alive", ["Bee Gees"]));
    expect(score).toBe(6);
  });

  it("still matches on a misspelled title via a strong artist match (the Staying Alive regression)", () => {
    const score = scoreCandidate("Staying Alive", "Bee Gees", track("Stayin' Alive", ["Bee Gees"]));
    expect(score).toBeGreaterThanOrEqual(MIN_MATCH_SCORE);
  });

  it("scores a wrong-artist cover low enough to be rejected", () => {
    const score = scoreCandidate(
      "Staying Alive",
      "Bee Gees",
      track("Stayin' Alive", ["N-Trance", "Ricardo Da Force"]),
    );
    expect(score).toBeLessThan(MIN_MATCH_SCORE);
  });

  it("scores a same-name mashup by unrelated artists low enough to be rejected", () => {
    const score = scoreCandidate(
      "Staying Alive",
      "Bee Gees",
      track("Stayin Alive x In Da Club (Mashup)", ["Antifarox", "DJ Kuff"]),
    );
    expect(score).toBeLessThan(MIN_MATCH_SCORE);
  });
});

describe("searchTracks", () => {
  it("marks a song as found when the top-scoring candidate clears the threshold", async () => {
    vi.mocked(spotifyFetch).mockResolvedValueOnce(
      jsonResponse({
        tracks: {
          items: [
            track("Stayin' Alive - From \"Saturday Night Fever\" Soundtrack", ["Bee Gees"]),
            track("Stayin' Alive", ["N-Trance", "Ricardo Da Force"]),
          ],
        },
      }),
    );

    const [result] = await searchTracks(fakeSession(), [{ title: "Staying Alive", artist: "Bee Gees" }]);

    expect(result.found).toBe(true);
    expect(result.spotifyArtist).toBe("Bee Gees");
  });

  it("marks a song as not found when nothing clears the match threshold", async () => {
    vi.mocked(spotifyFetch).mockResolvedValueOnce(
      jsonResponse({ tracks: { items: [track("Totally Unrelated Song", ["Someone Else"])] } }),
    );

    const [result] = await searchTracks(fakeSession(), [{ title: "A Made Up Song", artist: "Nobody Real" }]);

    expect(result.found).toBe(false);
  });

  it("marks a song as not found when the search request itself fails", async () => {
    vi.mocked(spotifyFetch).mockResolvedValueOnce(jsonResponse({}, false));

    const [result] = await searchTracks(fakeSession(), [{ title: "Anything", artist: "Anyone" }]);

    expect(result.found).toBe(false);
  });
});
