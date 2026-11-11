# Works page readability, copy, and a contact dock — design doc

Date: 2026-11-11
Repo: `ali-ulu/ai-ulu` (Forma re-skin on GitHub Pages).

## Problem

Three things the owner reported on the published site:

1. **The works intro reads badly.** "Bir ürünü kurup yayında tutabiliyorsam,
   sizin siteniz için de aynı işi yaparım." is a clunky conditional sentence, and
   the HUQAN card describes the product in unexplained jargon.
2. **Text is unreadable in both themes** on `/calismalar/` (and the blog shares
   the same styles). Measured with a real browser:
   - Light: `.wk-intro .lead` 1.11, `.wk-tag` 1.02, `.wk-detail` 1.06,
     `.wk-article-title` 2.31 (WCAG AA needs 4.5 for body text).
   - Dark: `.wk-intro .lead` 1.06, `.wk-summary` 1.11, `.wk-article-title` 1.11.
3. **No always-visible way to call.** The only contact affordance on phones is a
   text bar at the bottom; the owner wants a WhatsApp button and a direct call
   button docked in the bottom-right corner with recognisable icons.

## Root cause of the contrast failure

`--soft` is defined as `color-mix(in srgb, var(--fg) 5%, var(--bg))` — a **surface
tint**, 5% of the way from the ground to the ink. In light theme it is ~#e0dfdc
(almost the page colour); in dark theme ~#1c1c1b (almost the ground). `work.css`
and `blog.css` use it as a **text** colour, so the text paints at nearly the same
value as the background in both themes.

Compounding it, the card backgrounds are hard-coded dark
(`rgba(14,16,20,.55)`) regardless of theme. In light theme that makes a dark grey
slab on warm paper — the amber accents then sit at 1.0–1.6 contrast.

So the palette has no semantic split between "surface" and "text", and the two
block stylesheets invented their own colours instead of using one set.

## Goals

- Every text/background pair on `/calismalar/` and `/blog/` meets WCAG AA
  (≥4.5 for body text, ≥3.0 for large text) **in both themes**.
- One semantic token set: surfaces, secondary text and the accent all derive from
  `--fg`/`--bg`, so a theme flip is a one-line change.
- The works copy is plain, confident Turkish; the HUQAN description matches what
  HUQAN actually is (a governance/decision layer that judges an agent's action
  before it runs).
- A bottom-right dock with a WhatsApp button and a phone button, icons included,
  reachable on desktop and phone.

## Non-goals

- No change to the hero film, the base-path build, or the Pages deploy.
- No new third-party assets: icons are inline SVG (CSP `'self'`).
- No invented product facts: HUQAN copy follows huqan.com and its README.

## Design

### Tokens (site.css)

Add semantic tokens that both themes derive automatically (the dark block only
overrides `--bg`, `--fg`, `--amber`, `--accent`):

| token | light value | meaning |
| --- | --- | --- |
| `--surface` | `color-mix(fg 4%, bg)` | card fill, a hair off the ground |
| `--surface-2` | `color-mix(fg 8%, bg)` | hover fill |
| `--text-2` | `color-mix(fg 68%, bg)` | secondary body text |
| `--text-3` | `color-mix(fg 60%, bg)` | meta/labels (still ≥4.5) |
| `--accent` | `#9a3f1d` (dark: `#e0a458`) | accent **text**, tuned per theme |
| `--amber` | `#b4552f` | decorative fill only (WhatsApp pill, featured rule) |

`--accent` is separate from `--amber` because amber passes as a fill (white text
on it is 4.9) but fails as small text on the paper ground (3.9).

### Dock

A `nav.dock` fixed to the bottom-right with two 52px round buttons: WhatsApp
(green, brand glyph) and phone (ink, handset glyph), each an inline SVG with an
`aria-label`. It replaces the phone-only `.callbar` text bar so there is one
contact affordance, not two.

### Copy

- Intro lead: two plain sentences — the products are live and open source, all
  written by the owner, and the same care goes into a client site.
- HUQAN tagline/summary: a governance layer that decides before an agent acts
  (allow / review / block), records the reason, and never lets the agent author
  its own approval. Keep the plain-Turkish voice; drop unexplained terms.

## Verification

- A Playwright contrast check on `/calismalar/` in both themes: every sampled
  text node ≥4.5 (≥3.0 for ≥24px).
- Static guards: the block stylesheets must not use `--soft` as a text colour and
  must not hard-code the old dark card fill.
- The dock is present on every page with a `tel:` and a `wa.me` link.
- `npm test`, `npm run lint`, `npm run check`, `npm run test:e2e` green.
