# MixAI design system

Brief for building new pages/components (e.g. a marketing landing page) that
feel like they belong in the same app as the existing chat wizard at `/`.
Source of truth is `src/app/globals.css` — read it directly for anything not
covered here. Don't invent a new visual language; extend this one.

## Identity

Dark-only, night-club aesthetic — not a generic SaaS/AI app look. Deliberately
avoids the "purple gradient + pill buttons" AI-app cliché. Think event
signage / ticket stub / flyer, not dashboard.

- `color-scheme: dark` is hardcoded. There is no light theme — don't add one.
- A fixed, low-opacity SVG film-grain texture sits behind everything
  (`body::before`, `opacity: 0.05`, fractal noise). New full-page surfaces
  should keep this rather than replacing it with a flat background.
- Voice: short, uppercase "eyebrow" labels above headings (e.g. "Tonight's
  lineup"), display-font headlines in ALL CAPS, muted secondary copy. Event/DJ
  language over generic product language ("build the set", not "get started").

## Type

Two Google fonts, loaded via `next/font/google` in `layout.tsx` as CSS vars
`--font-anton` / `--font-archivo`, exposed as:

- `--font-display: var(--font-anton), Impact, sans-serif` — headlines only.
  Weight 400 (Anton has no other weights), always uppercase, tight
  `line-height: 0.85–1`, slightly negative/neutral letter-spacing.
- `--font-body: var(--font-archivo), -apple-system, sans-serif` — everything
  else: body copy, buttons, labels, inputs. Weights 400/500/600/700 loaded.

Type scale (rem):
`--text-xs: 0.75`, `--text-sm: 0.875`, `--text-base: 1`, `--text-lg: 1.25`,
`--text-xl: 1.75`, `--text-2xl: 2.75`, `--text-3xl: 3.75`.

## Color

```
--bg:         #0c0a09   page background
--bg-raised:  #171310   cards, panels, chat surface
--bg-inset:   #060504   recessed wells (inputs, empty art slots)
--fg:         #f5f1e8   primary text (warm off-white, not pure white)
--muted:      #9c9388   secondary text
--border:     #2b241d   hairline borders/dividers

--accent:     #d7ff3f   acid/lime green — primary accent, CTAs, active states
--accent-ink: #0c0a09   text/icon color when placed ON --accent
--accent-2:   #ff3d7f   hot pink — secondary accent, used sparingly (e.g. the
                        hard-shadow offset on button hover)
--danger:     #ff5a4d   errors, "missing" states
```

Usage rules: `--accent` is the one loud color and should stay reserved for the
primary action / current-state signal (active tab, current step, CTA button,
links inside dark chips). Don't introduce new brand colors — compose from this
six-color set. `--accent-2` is a spark, not a second primary — one accent per
screen, not a rainbow.

## Space, radius

```
--space-1..6: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2.5rem
--radius-sm:  3px   (buttons, chips, small elements)
--radius-md:  6px   (chat panel)
--radius-lg:  10px  (larger cards, embeds)
```

Radii are small and boxy on purpose — this is a hard-edged, brutalist-leaning
system, not a soft rounded one. Don't reach for large border-radius or soft
drop-shadows.

## Layout

- Single centered column, `max-width: 880px`, `padding: var(--space-6)
  var(--space-4)`. A landing page can go wider for hero sections but should
  return to this column width for content-dense sections to match the app.
- `.top-bar`: flex row, `justify-content: space-between`,
  `align-items: flex-start`, wraps on small screens — used to pair a
  title block with a right-aligned status element (see Account badge below).
  Reuse this pattern for a landing-page header (logo/wordmark left, nav or CTA
  right) rather than inventing a new header component.
- Sectioning uses hairline `border-top`/`border-bottom` in `--border` rather
  than background-color blocks or shadows to separate regions (see
  `.step-indicator`).

## Core components (reuse, don't recreate)

**Buttons** (`.button`, `<button>`): solid `--accent` fill, `--accent-ink`
text, no border, small radius, bold uppercase label with letter-spacing.
Signature interaction: on hover, the button translates `-2px, -2px` and gains
a hard 4px offset shadow in `--accent-2` (`box-shadow: 4px 4px 0
var(--accent-2)`) — a flat "sticker lifting off the page" effect, not a blur
shadow. Disabled: `opacity: 0.4`, no hover transform. This hover treatment is
the single most distinctive interaction in the system — carry it to any new
primary CTA.

**Eyebrow label** (`.eyebrow`): tiny, uppercase, bold, `letter-spacing:
0.16em`, colored `--accent`. Sits directly above a display-font headline.
Use this pairing (eyebrow + Anton headline) for every new section heading.

**Cards** (`.persona-card` pattern): flat `--bg-raised` panels tiled edge to
edge with a 1px `--border` gap between them (achieved via grid `gap: 1px` on
a `--border`-colored grid container, not individual card borders) — reads as
a single perforated sheet rather than floating cards with shadows. A large
display-font index/number (`.persona-index`) in `--border` color, brightening
to `--accent` on hover, is used as a card's visual anchor instead of an icon.

**Tabs/pills** (`.panel-tab`): bordered container, flat segments, active
segment fills solid `--accent`/`--accent-ink`. No pill/rounded-full shapes.

**Badges/chips** (`.coming-soon-badge`, `.track-badge`, `.quick-reply-chip`):
outlined, not filled, small radius, uppercase, small bold text. Filled only to
show an active/selected state.

**Status badge** (`.account-badge`, new): compact pill-ish container —
`--bg-raised` fill, 1px `--border`, `--radius-lg` — pairing a small circular
avatar with a name and a quiet outlined action button. This is the pattern
for "who/what is currently connected" indicators; reuse it rather than a
dropdown menu.

**Chat bubbles** (`.chat-message--user` / `--assistant`): user messages fill
`--accent`/`--accent-ink`; assistant messages are `--bg-inset` with a
`--border` outline. Same accent-fill-for-"you"/outline-for-"other" logic can
extend to any two-party UI (e.g. testimonials, before/after).

## Motifs to carry into a landing page

- Numbered/indexed sections in the display font (`01`, `02`, …), same trick
  used in `.persona-index` and could anchor feature/step sections.
  `.step-indicator`'s ticket-stub row (bordered cells, numbers, labels) is a
  good model for a "how it works" strip.
- Everything is left-aligned, not centered — headlines, body copy, cards.
  Keep that in a landing page rather than defaulting to centered hero text.
- Real product language throughout ("Tonight's lineup", "Connect Spotify",
  "Describe the vibe. It builds the set.") — short, imperative, DJ/event
  vocabulary. Avoid generic marketing filler ("Unlock the power of AI...").
- Spotify attribution line (`.attribution`, small `--muted` text) appears
  under the embedded playlist per Spotify's developer terms — if the landing
  page shows any Spotify-sourced content (album art, playlist previews),
  carry the same attribution treatment.

## What NOT to do

- No light mode, no soft pastel/purple gradients, no large soft box-shadows,
  no fully rounded pill buttons, no centered hero copy blocks, no new accent
  colors beyond the six above.
