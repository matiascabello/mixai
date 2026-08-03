# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is pre-implementation: `package.json` is an empty stub (no dependencies, no real scripts) and no application code exists yet. There is no build, lint, or test tooling to run. When scaffolding the project, follow the architecture implied below (LLM playlist agent + Spotify Web API integration) and update this file with real commands once they exist.

# MixAI

*Describe the vibe. It builds the set.*

## About

The idea is simple: this is a web app that acts as a professional DJ. It is a wizard to simplify the creation of playlists for parties or events, given the user's preferences.

## How is intended to work

- The flow starts with a prompt to an LLM model -aka "agent"- (we'll be using OpeanAI API), for example:

> "I'm organizing my wife's 40th birthday party. She was born in 1986. I'd like you to help me to build a playlist for the party. Mostly songs to dance to. I'll share some references: Bee Gees - Night Fever; Daft Punk - Give Life Back to Music"

- The agent may ask for some additional specifications, such as the length of the playlist or the number of songs wanted.

- Then the agent replies with a list of songs.

- The agent may also ask to the user for a specific song order criteria (e.g. to build tension)

- Once the user is happy with the song list and order, the app searches each song in Spotify and builds a playlist.

- The playlist is displayed inside the app, using Spotify's widget.

## Spotify Integration

You are helping me build an application using the Spotify Web API. Follow these rules:

- OpenAPI spec: Refer to the Spotify OpenAPI specification at https://developer.spotify.com/reference/web-api/open-api-schema.yaml for all endpoint paths, parameters, and response schemas. Do not guess endpoints or field names.
- Authorization: Use the Authorization Code with PKCE flow (https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) for any user-specific data. If the app has a secure backend, the Authorization Code flow (https://developer.spotify.com/documentation/web-api/tutorials/code-flow) is also acceptable. Only use Client Credentials for public, non-user data. Never use the Implicit Grant flow (it is deprecated).
- Redirect URIs: Always use HTTPS redirect URIs (except http://127.0.0.1 for local development). Never use http://localhost or wildcard URIs. See https://developer.spotify.com/documentation/web-api/concepts/redirect_uri for requirements.
- Scopes: Request only the minimum scopes (https://developer.spotify.com/documentation/web-api/concepts/scopes) needed for the features being built. Do not request broad scopes preemptively.
- Token management: Store tokens securely. Never expose the Client Secret in client-side code. Implement token refresh (https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens) logic and send the user through authorization again when a refresh token expires.
- Rate limits: Implement exponential backoff and respect the Retry-After header when receiving HTTP 429 responses. Do not retry immediately or in tight loops.
- Deprecated endpoints: Do not use deprecated endpoints. Prefer /playlists/{id}/items over /playlists/{id}/tracks, and use /me/library over the type-specific library endpoints.
- Error handling: Handle all HTTP error codes documented in the OpenAPI schema. Read the returned error message and use it to provide meaningful feedback to the user.
- Developer Terms of Service: Comply with the Spotify Developer Terms (https://developer.spotify.com/terms). In particular: do not cache Spotify content beyond what is needed for immediate use, always attribute content to Spotify, and do not use the API to train machine learning models on Spotify data.
