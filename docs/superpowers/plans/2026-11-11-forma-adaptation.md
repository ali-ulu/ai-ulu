# Forma adaptation — implementation plan

Spec: `docs/superpowers/specs/2026-11-11-forma-adaptation-design.md`

## Global constraints

- Static output only; CSP `'self'`; no third-party URLs.
- Base path default `/`, Pages `/ai-ulu/` (env `BASE_PATH`).
- Keep `npm test` green; visual-only tests may be rewritten.
- Turkish copy and SEO output preserved.

## Tasks

### Task 1: Base path support in the generator

Files: `src/site/config.mjs`, `scripts/build.mjs`.
- Add `site.base = process.env.BASE_PATH || "/"` (normalised, trailing slash).
- `scripts/build.mjs`: after writing dist, rewrite root-absolute refs to carry
  `site.base` across `dist/**/*.{html,css,js,xml,txt,webmanifest}`.
- Test: `test/base-path.test.js` — build output with `BASE_PATH=/ai-ulu/` has no
  root-absolute `href="/x"` that lacks the prefix.

### Task 2: Fonts (Geist) + Forma design tokens

Files: `scripts/fetch-fonts.mjs` (new), `src/site/assets/fonts/*`.
- Download Geist 400/500/600 latin+latin-ext woff2 from the OFL source into the
  repo (fonts are build inputs, not runtime fetches).
- Test: `test/fonts.test.js` — each Geist woff2 exists and `fonts.css` declares it.

### Task 3: Re-skin — `site.css` on Forma

Files: `src/site/assets/site.css`, `src/site/components/layout.mjs`.
- Tokens, `.eyebrow/.display/.h2/.lead/.btn/.tlink/.nav/.wordmark/.footer` etc.
- Layout: pill nav (brand, links, theme toggle, WhatsApp pill), skip link, footer
  with grid + wordmark; drop the fixed vortex canvas + vignette.
- Test: rewrite `test/vortex-background.test.js` → `test/forma-design.test.js`
  (tokens present, no dark-only assumptions, theme toggle wired).

### Task 4: Home hero + sections on Forma

Files: `src/site/components/home.mjs`, `src/site/components/blog.mjs`,
`src/site/components/work.mjs`, `src/site/assets/blog.css`, `work.css`.
- Hero: eyebrow, `h1` with `.serif` accent, aside, CTAs, wordmark backdrop,
  `<canvas id="liquid">`, hint.
- Sections restyled with Forma classes; keep ids (`#nasil`, `#neden`,
  `#paketler`, `#sss`, `#iletisim`, `#blog`).
- Test: `test/forma-home.test.js` — hero markup, section anchors, one `h1`.

### Task 5: Liquid particle hero

Files: `src/site/assets/liquid.js` (new), `src/site/components/home.mjs`.
- WebGL2 ping-pong particle system; reduced-motion static frame; remove canvas
  when WebGL2 is unavailable; no external resources.
- Test: `test/liquid-hero.test.js` — module requests `webgl2`, honours reduced
  motion, removes the canvas on failure, has no `http(s)://`.

### Task 6: Static-friendly lead form

Files: `src/site/assets/app.js`, `src/site/components/home.mjs`, `e2e/*`.
- Keep `#lead-form`, field names, `#form-status`, `#pm-thanks`.
- On `/api/lead` failure: open prefilled `wa.me` message, then show thanks.
- Test: `test/postmark-form.test.js` updated for the WhatsApp fallback.

### Task 7: Gallery base-relative

Files: `apps/sablonlar/vite.config.ts`, `apps/sablonlar/index.html`.
- Vite `base: "./"`; head asset links relative; canonical → Pages URL.
- Test: `test/frontend-checklist.test.js` still passes.

### Task 8: GitHub Pages deploy

Files: `.github/workflows/pages.yml` (new), `scripts/serve.mjs` (keep).
- `actions/configure-pages`, `upload-pages-artifact` (path `dist`), `deploy-pages`.
- Build with `BASE_PATH=/ai-ulu/`.
- Test: `test/ci-workflow.test.js` extended — a Pages job exists and deploys
  `dist` from `main`.

### Task 9: Verify

- `npm run build` (both base paths), `npm test`, `npm run check`.
- Local serve of `dist` under `/ai-ulu/`, screenshot hero at 1440 and 390.
- After deploy: fetch the Pages URL, confirm 200 + content; confirm a subpage.
