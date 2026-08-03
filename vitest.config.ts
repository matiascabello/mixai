import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // src/lib/spotify/auth.ts throws at import time if these are unset — dummy values
    // are enough since tests mock the actual network calls that would use them.
    env: {
      SPOTIFY_CLIENT_ID: "test-client-id",
      SPOTIFY_CLIENT_SECRET: "test-client-secret",
      SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/api/spotify/callback",
    },
  },
});
