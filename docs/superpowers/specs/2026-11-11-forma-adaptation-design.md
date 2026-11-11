# ai-ulu on the Forma design — design doc

Date: 2026-11-11
Repo: `ali-ulu/ai-ulu` (new). Source code copied from `ali-ulu/ai-ulu.com`, which is left untouched.

## Intent and why

`ai-ulu.com`'s domain registration has lapsed, so the live site now serves a
"domain is expired" parking page (Hostinger/hcdn). We need a working address to
send to customers, without touching the domain, Cloudflare or Hostinger settings.
The owner also wants the site re-skinned to the **Forma** template
(`forma-liquid-particle-studio-template-v1.21st.app`) — a light, editorial studio
look built around a WebGL "liquid particle" hero.

Goal: publish the existing ai-ulu content on GitHub Pages under the Forma design,
in a new repo, leaving the old repo and all DNS/Cloudflare/Hostinger settings alone.

## Goals

- The existing content survives: home, blog (5 posts), çalışmalar, gizlilik,
  kullanım şartları, 404, örnek tasarımlar gallery.
- The look is recognisably Forma: warm light ground, Geist/Instrument Serif type,
  full-bleed liquid-particle hero on the home page, pill nav, wordmark footer.
- Published and reachable at `https://ali-ulu.github.io/ai-ulu/`.
- The lead form still works for a customer, with no backend.

## Non-goals

- No React/Vite rewrite of the site (the template's stack is not copied).
- No change to `ali-ulu/ai-ulu.com`, its Cloudflare Worker, D1, or the domain.
- No pricing, address or other invented facts.

## Anti-goals

- A site that only renders with JavaScript, or that breaks when WebGL is missing.
- Root-absolute URLs that 404 under the `/ai-ulu/` project base path.
- Shipping a form that silently fails because `/api/lead` is not there.

## Constraints

- Static hosting only (GitHub Pages): no server, no secrets, no `/api/*`.
- CSP stays `'self'`-only: no third-party scripts, fonts or images.
- The project site is served under `/ai-ulu/`, so every root-absolute URL must
  carry that prefix.
- Existing repo tests encode real intent (SEO, a11y, form contract, HTML validity);
  keep them green. Only purely-visual tests change with the design.

## Approaches considered

1. **Port the template's React/Vite stack and move content into it.** Highest
   visual fidelity, but throws away the tested static generator, its SEO output
   and its tests, and adds a client-side app to a content site.
2. **Keep the generator, re-skin to Forma, port the hero (chosen).** The content,
   SEO, blog and legal pages stay as tested; the CSS, layout components and the
   hero change. Base-path and form work is small and local.
3. **Only swap colours/fonts on the current dark design.** Cheapest, but does not
   deliver the Forma look (light ground, editorial type, particle hero) the owner
   asked for.

Chosen: **2**. Fidelity is high where it matters (hero, type, palette, layout),
cost is bounded, and the tested content pipeline is preserved.

## Design

### Design system (from the template, measured)

- Tokens: `--bg:#ebe9e5`, `--fg:#151514`, `--muted` (58% mix), `--line` (14%),
  `--soft` (5%); dark theme `--bg:#111110`, `--fg:#f1efea`.
- Type: `--head`/`--body` = Geist (self-hosted, OFL); `--serif` = Instrument Serif
  italic for accents. Scale: `.display` clamp(44px,7vw,120px), `.h2`
  clamp(36px,4.8vw,76px), `.wordmark` clamp(96px,23vw,380px).
- Rhythm: `--gut` clamp(20px,3.3vw,48px), `.section` clamp(96px,13vw,200px),
  `--ease: cubic-bezier(.2,.7,.2,1)`.
- Components: pill nav with a theme toggle, `.btn` (solid pill), `.tlink`
  (underlined text link), `.eyebrow` (rule + uppercase), `.tag`, work grid,
  numbers, marquee, contact form.

### Pages

- **Home**: Forma hero (eyebrow, big headline with an italic accent, one aside
  paragraph, two CTAs, wordmark backdrop, particle canvas) → studio/manifesto →
  "ne kazanırsınız" cards → "neden" → süreç → paketler → SSS drawer → blog teaser
  → contact (closing block).
- **Blog index / post**, **çalışmalar**, **gizlilik**, **kullanım şartları**,
  **404**, **sablonlar gallery**: Forma typography and layout, no hero canvas.

### Liquid particle hero

A clean-room, self-contained WebGL2 module (`liquid.js`), no three.js:

- Ping-pong float texture holds each particle's offset + velocity.
- Home positions live in a static texture; the draw pass reads them by
  `gl_VertexID` and draws soft round points.
- Per frame: pointer force (push outward + swirl), curl-noise turbulence, elastic
  spring back to home, damping. Reduced motion → one static frame.
- No WebGL2 → the canvas is removed and the hero falls back to the static wordmark
  and copy (never a blank hero).

### Base path

Build with `BASE_PATH` (default `/`, GitHub Pages `/ai-ulu/`). A post-build pass
rewrites root-absolute references (`href="/…"`, `src="/…"`, `url(/…)`, `"/api…"`)
in `dist/**/*.{html,css,js,xml,txt,webmanifest}` so the same generator serves both
`/` (Cloudflare) and `/ai-ulu/` (Pages) with no per-file changes. Canonical, `og:url`
and the sitemap use `site.url`, which becomes the Pages URL in this repo.

### Contact form on a static host

Submit tries `POST /api/lead` first (works where the Worker exists). On any
non-OK or network failure it falls back to opening a prefilled WhatsApp message
built from the fields, then shows the thank-you block. No silent failure; no
backend needed for the customer to reach the owner.

### Gallery

`apps/sablonlar` keeps its React build; its Vite `base` becomes relative (`./`) so
its assets resolve under `/ai-ulu/sablonlar/` at any depth, and its `index.html`
head links become base-relative.

## What is left to the builder

- Exact class names and CSS structure of the re-skin.
- The hero's particle count, forces and visual tuning.
- Which purely-visual tests are rewritten vs. dropped.
