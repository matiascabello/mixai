export type SpotifySession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
};

export type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export type MatchedTrack = {
  title: string;
  artist: string;
  found: boolean;
  spotifyUri?: string;
  spotifyTitle?: string;
  spotifyArtist?: string;
  albumArtUrl?: string;
  albumName?: string;
  durationMs?: number;
};
