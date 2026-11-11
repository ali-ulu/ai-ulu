# Plan — works readability, copy, and a contact dock

Spec: `docs/superpowers/specs/2026-11-11-works-readability-and-dock-design.md`

Order matters: tokens first (everything reads them), then the stylesheets, then
copy, then the dock, then verify.

## Task 1 — semantic tokens in `site.css`

- Add `--surface`, `--surface-2`, `--text-2`, `--text-3`, `--accent` to `:root`.
- Dark block overrides `--amber` and `--accent` for contrast on `#111110`.
- Keep `--soft`/`--dim`/`--bone` aliases so other sheets do not break.

## Task 2 — `work.css` on the tokens

- Cards: `background:var(--surface)`, hairline `var(--line)`, no fixed dark slab.
- Text: heading `var(--fg)`, summary `var(--text-2)`, detail/meta `var(--text-3)`,
  accent text `var(--accent)`.
- Remove the `text-shadow` hacks that assumed a dark ground.

## Task 3 — `blog.css` on the tokens

- Same substitutions: `.bl-head .lead`, `.bl-meta`, `.bl-card`, `.bl-post`,
  `.bl-note`, `.bl-back`, `.bl-more`.
- `.bl-card-eyebrow` accent → `var(--accent)`.

## Task 4 — `postmark-form.css` aside

- `.pm-aside` / `.pm-aside a` read `var(--text-3)` / `var(--accent)`.

## Task 5 — copy

- `src/site/components/work.mjs`: rewrite the intro lead.
- `src/site/content/work.mjs`: rewrite the HUQAN tagline/summary/detail in plain
  Turkish, matching huqan.com (governance layer, allow/review/block, Trust
  Receipt written by the gate).
- Update the header comment so the intent stays accurate.

## Task 6 — the dock

- `layout.mjs`: replace `nav.callbar` with `nav.dock` (WhatsApp + phone, inline
  SVG icons, aria-labels).
- `site.css`: `.dock` fixed bottom-right; hidden in print.
- `print.css`: hide `.dock` too.

## Task 7 — tests

- `test/forma-design.test.js`: pin the new tokens.
- New `test/works-readability.test.js`: block sheets must not use `--soft` as a
  text colour nor the fixed dark card fill; the dock exists with `tel:` + `wa.me`.
- `test/work.test.js`: assert the intro no longer contains the clunky sentence.

## Task 8 — verify and ship

- `npm run build`, `npm test`, `npm run lint`, `npm run check`, `npm run test:e2e`.
- Playwright contrast sweep both themes (≥4.5 / ≥3.0 large).
- Commit, push, confirm the Pages build publishes, check live.
