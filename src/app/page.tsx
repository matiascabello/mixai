const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "That login request expired or didn't match — please try connecting again.",
  access_denied: "Spotify access was declined. Connect again if you'd like to give it another go.",
};

function errorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? `Couldn't connect to Spotify (${code}). Please try again.`;
}

type LandingPageProps = {
  searchParams: Promise<{ spotify_error?: string }>;
};

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const { spotify_error: spotifyError } = await searchParams;

  return (
    <main className="page landing">
      <header>
        <h1>
          Mix<span className="accent-text">AI</span>
        </h1>
      </header>

      <div className="landing-main">
        <p className="eyebrow">Tonight&rsquo;s lineup</p>
        <h1 className="landing-title">
          Describe the vibe.
          <br />
          It builds the set.
        </h1>
        <p className="landing-subtitle">
          MixAI is an AI DJ. Tell it the occasion, the crowd, a few reference tracks — it asks a
          couple of questions, builds a tracklist, and drops a real playlist straight into your
          Spotify.
        </p>
        <div className="landing-cta-row">
          <a className="button" href="/api/spotify/login">
            Connect Spotify
          </a>
          <span className="landing-cta-note">No signup. Just your Spotify account.</span>
        </div>
        {spotifyError && <p className="page-error">{errorMessage(spotifyError)}</p>}
      </div>

      <footer className="landing-footer">
        For testing and efficiency, this demo runs on <strong>gpt-5.6-terra</strong>. Clone the
        repo, drop in your own OpenAI key, and try other models or rewrite the DJ personas
        yourself — <a href="https://github.com/matiascabello/mixai">repo and documentation</a>.
      </footer>
    </main>
  );
}
