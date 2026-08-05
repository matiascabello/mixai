"use client";

import { useState } from "react";
import type { MatchedTrack } from "@/types/spotify";

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

type TrackConfirmationListProps = {
  playlistName: string;
  tracks: MatchedTrack[];
  onCreatePlaylist: (playlistName: string, trackUris: string[]) => Promise<void>;
  isCreating: boolean;
};

export function TrackConfirmationList({
  playlistName,
  tracks,
  onCreatePlaylist,
  isCreating,
}: TrackConfirmationListProps) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  function toggle(uri: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) {
        next.delete(uri);
      } else {
        next.add(uri);
      }
      return next;
    });
  }

  const confirmedTracks = tracks.filter(
    (track) => track.found && track.spotifyUri && !excluded.has(track.spotifyUri),
  );
  const confirmedUris = confirmedTracks.map((track) => track.spotifyUri as string);
  const totalDurationMs = confirmedTracks.reduce((sum, track) => sum + (track.durationMs ?? 0), 0);

  return (
    <div className="track-confirmation">
      <p className="track-confirmation-eyebrow">Your playlist</p>
      <h2 className="track-confirmation-title">{playlistName}</h2>
      <ul className="track-list">
        {tracks.map((track, index) => {
          const key = track.spotifyUri ?? `${track.title}-${track.artist}-${index}`;
          const isExcluded = track.spotifyUri ? excluded.has(track.spotifyUri) : false;
          return (
            <li key={key} className={`track-item${track.found ? "" : " track-item--missing"}`}>
              {track.albumArtUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={track.albumArtUrl} alt="" className="track-art" />
              ) : (
                <div className="track-art" />
              )}
              <div className="track-info">
                {track.found ? (
                  <>
                    <div className="track-title">{track.spotifyTitle}</div>
                    <div className="track-artist">{track.spotifyArtist}</div>
                  </>
                ) : (
                  <>
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                    <span className="track-badge track-badge--missing">Not found</span>
                  </>
                )}
              </div>
              {track.found && track.spotifyUri && (
                <label className="track-include">
                  <input
                    type="checkbox"
                    checked={!isExcluded}
                    onChange={() => toggle(track.spotifyUri as string)}
                  />
                  Include
                </label>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={isCreating || confirmedUris.length === 0}
        onClick={() => void onCreatePlaylist(playlistName, confirmedUris)}
      >
        {isCreating
          ? "Creating playlist…"
          : `Create Playlist (${confirmedUris.length} songs · ${formatDuration(totalDurationMs)})`}
      </button>
    </div>
  );
}
