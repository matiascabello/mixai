"use client";

import { useEffect, useState } from "react";
import type { SpotifyProfile } from "@/types/spotify";

type AccountBadgeProps = {
  onLoggedOut: () => void;
};

export function AccountBadge({ onLoggedOut }: AccountBadgeProps) {
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/spotify/me")
      .then((res) => (res.ok ? (res.json() as Promise<SpotifyProfile>) : null))
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/spotify/logout", { method: "POST" });
    } finally {
      setIsLoggingOut(false);
      onLoggedOut();
    }
  }

  return (
    <div className="account-badge">
      {profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarUrl} alt="" className="account-avatar" />
      ) : (
        <div className="account-avatar" />
      )}
      <span className="account-name">{profile?.displayName ?? "Connected"}</span>
      <button type="button" className="account-logout" onClick={() => void handleLogout()} disabled={isLoggingOut}>
        {isLoggingOut ? "…" : "Log out"}
      </button>
    </div>
  );
}
