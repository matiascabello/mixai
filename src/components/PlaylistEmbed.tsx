import { PERSONAS, type PersonaId } from "@/lib/openai/personas/registry";

type PlaylistEmbedProps = {
  playlistId: string;
  playlistName: string;
  personaId: PersonaId;
};

export function PlaylistEmbed({ playlistId, playlistName, personaId }: PlaylistEmbedProps) {
  const persona = PERSONAS[personaId];

  return (
    <div className="playlist-reveal">
      <p className="playlist-reveal-eyebrow">Playlist ready</p>
      <h2 className="playlist-reveal-title">{playlistName}</h2>
      <p className="playlist-reveal-subtitle">{persona.displayName} put this together for you. Enjoy the night.</p>
      <div className="playlist-embed-frame">
        <iframe
          title="Spotify playlist"
          src={`https://open.spotify.com/embed/playlist/${playlistId}`}
          width="100%"
          height="380"
          style={{ border: "none", display: "block" }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
      <p className="attribution">Playlist created and played via Spotify.</p>
    </div>
  );
}
