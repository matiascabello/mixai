import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session/cookies";
import type { MatchedTrack } from "@/types/spotify";
import type { ProposedSong } from "@/types/chat";
import { spotifyFetch } from "./client";

export type SpotifyTrackItem = {
  uri: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  duration_ms: number;
};

type SpotifySearchResponse = {
  tracks?: {
    items: SpotifyTrackItem[];
  };
};

// A proposed title/artist rarely matches Spotify's catalog string exactly — LLM output can be
// misspelled (e.g. "Staying Alive" instead of "Stayin' Alive"), use curly vs straight quotes, or
// omit/add soundtrack suffixes. Spotify's field-filtered search (track:/artist:) is strict enough
// that these near-misses return zero results. Free-text search plus scoring the top candidates
// ourselves is far more forgiving and mirrors what Spotify's own search box does.
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "") // strip diacritics (nonspacing marks left behind by NFD normalization)
    .toLowerCase()
    .replace(/['’‘"“”]/g, "") // strip quote/apostrophe variants
    .replace(/\(.*?\)/g, "") // strip parenthetical suffixes (feat., remaster, live, etc.)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function scoreCandidate(
  queryTitle: string,
  queryArtist: string,
  item: SpotifyTrackItem,
): number {
  const nQueryTitle = normalize(queryTitle);
  const nQueryArtist = normalize(queryArtist);
  const nItemTitle = normalize(item.name);
  const nItemArtists = item.artists.map((a) => normalize(a.name));

  let score = 0;
  if (nItemTitle === nQueryTitle) score += 3;
  else if (nItemTitle.includes(nQueryTitle) || nQueryTitle.includes(nItemTitle)) score += 1;

  if (nItemArtists.includes(nQueryArtist)) score += 3;
  else if (nItemArtists.some((a) => a.includes(nQueryArtist) || nQueryArtist.includes(a))) score += 1;

  return score;
}

// Below this, the closest result isn't a confident enough match on either title or artist.
export const MIN_MATCH_SCORE = 2;

async function searchTrack(
  session: IronSession<SessionData>,
  title: string,
  artist: string,
): Promise<MatchedTrack> {
  const params = new URLSearchParams({
    q: `${title} ${artist}`,
    type: "track",
    limit: "5",
  });

  const res = await spotifyFetch(session, `/search?${params.toString()}`);
  if (!res.ok) {
    return { title, artist, found: false };
  }

  const data = (await res.json()) as SpotifySearchResponse;
  const candidates = data.tracks?.items ?? [];

  const best = candidates
    .map((item) => ({ item, score: scoreCandidate(title, artist, item) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score < MIN_MATCH_SCORE) {
    return { title, artist, found: false };
  }

  const match = best.item;
  return {
    title,
    artist,
    found: true,
    spotifyUri: match.uri,
    spotifyTitle: match.name,
    spotifyArtist: match.artists.map((a) => a.name).join(", "),
    albumArtUrl: match.album.images[0]?.url,
    albumName: match.album.name,
    durationMs: match.duration_ms,
  };
}

// Sequential on purpose: keeps us well under Spotify's rate limits for a POC-sized playlist
// and lets the shared spotifyFetch backoff logic handle any 429s cleanly, one call at a time.
export async function searchTracks(
  session: IronSession<SessionData>,
  songs: ProposedSong[],
): Promise<MatchedTrack[]> {
  const results: MatchedTrack[] = [];
  for (const song of songs) {
    results.push(await searchTrack(session, song.title, song.artist));
  }
  return results;
}
