import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

// The Forma system: warm paper ground, Geist text, italic serif accents, and a
// measured type/rhythm scale. These values are the design contract; changing
// them changes the whole site, so they are pinned here.
test("the design tokens match the Forma palette and type", async () => {
  const css = await read("src/site/assets/site.css");
  const root = css.match(/:root\{[^}]*\}/)[0];
  assert.match(root, /--bg:#ebe9e5/, "paper ground");
  assert.match(root, /--fg:#151514/, "near-black ink");
  assert.match(root, /color-scheme:light/, "light is the default finish");
  assert.match(root, /--head:"Geist"/, "Geist heads the type stack");
  assert.match(root, /--serif:"Instrument Serif"/, "the italic serif accent");
  assert.match(root, /--muted:color-mix\(in srgb,var\(--fg\) 66%,var\(--bg\)\)/, "muted derives from ink and ground");
  assert.match(root, /--ease:cubic-bezier\(\.2,\.7,\.2,1\)/, "the shared easing curve");
  assert.match(css, /:root\[data-theme="dark"\]\{[^}]*--bg:#111110/, "a dark finish is available on request");
});

test("the type scale is clamped and fluid", async () => {
  const css = await read("src/site/assets/site.css");
  const display = css.match(/\.display\{[^}]*\}/)[0];
  assert.match(display, /clamp\(44px,7vw,120px\)/, "the display size is fluid");
  const h2 = css.match(/\.s h1,\.s h2\{[^}]*\}/)[0];
  assert.match(h2, /clamp\(/, "section heads scale with the viewport");
  const chapter = css.match(/\.ch h1,\.ch h2\{[^}]*\}/)[0];
  assert.match(chapter, /font-weight:500/, "chapter headlines are medium weight");
  assert.match(chapter, /letter-spacing:-\.035/, "chapter headlines are tightly set");
});

test("content sections are divided by a hairline rule, not tiles", async () => {
  const css = await read("src/site/assets/site.css");
  const section = css.match(/section\.s\{[^}]*\}/)[0];
  assert.match(section, /border-top:1px solid var\(--line\)/, "each section starts with a rule");
  const cell = css.match(/\.cell\{[^}]*\}/)[0];
  assert.match(cell, /border-top:1px solid var\(--line\)/, "cells are ruled, not boxed");
  assert.doesNotMatch(cell, /border-radius:18px/, "no glass-tile corners in the Forma system");
  assert.doesNotMatch(cell, /backdrop-filter/, "no frosted tiles in the Forma system");
});

test("the grid recomposes to one column on small screens", async () => {
  const css = await read("src/site/assets/site.css");
  assert.match(css, /\.g4,\.g3\{grid-template-columns:1fr\}/, "four- and three-up grids collapse on phones");
});

test("the footer closes the page without a giant wordmark", async () => {
  const css = await read("src/site/assets/site.css");
  assert.doesNotMatch(css, /\.wordmark\{/, "the oversized wordmark style is gone");
  const html = await read("dist/index.html");
  assert.doesNotMatch(html, /class="wordmark"/, "no page carries the wordmark lockup");
  assert.match(html, /class="footer-base"/, "the footer base line still closes the page");
});

// The contact dock at the bottom-right is the single always-visible WhatsApp
// entry point; the header no longer carries one, so nothing competes with it.
test("the header does not duplicate the dock's WhatsApp button", async () => {
  const html = await read("dist/index.html");
  const header = html.split('class="site-header"')[1].split("</header>")[0];
  assert.doesNotMatch(header, /wa\.me/, "the header must not carry a WhatsApp button");
  assert.doesNotMatch(html, /class="btn nav-cta"/, "the old header CTA is gone");
});

// The dock keys are glossy 3D spheres, matching the client's references: WhatsApp
// is green with a white glyph, the call button gold with a dark handset.
test("the contact dock keys are glossy 3D spheres", async () => {
  const css = await read("src/site/assets/site.css");
  const root = css.match(/:root\{[^}]*\}/)[0];
  for (const token of ["--wa-1:", "--wa-2:", "--wa-3:", "--wa-edge:", "--gold-1:", "--gold-2:", "--gold-3:", "--gold-edge:"]) {
    assert.ok(root.includes(token), `site.css must define ${token}`);
  }
  const base = css.match(/\.dock-btn\{[^}]*\}/)[0];
  assert.match(base, /border-radius:50%/, "the keys are round");
  const shine = css.match(/\.dock-btn::before\{[^}]*\}/)[0];
  assert.match(shine, /rgba\(255,255,255,\.85\)/, "the shine is a white sweep");
  const wa = css.match(/\.dock-btn\.wa\{[^}]*\}/)[0];
  assert.match(wa, /radial-gradient\(circle at 50% 26%/, "the WhatsApp key is a glossy sphere");
  assert.match(wa, /var\(--wa-2\)/, "it uses the WhatsApp green");
  assert.match(wa, /0 5px 0 var\(--wa-edge\)/, "it has an extruded edge");
  const tel = css.match(/\.dock-btn\.tel\{[^}]*\}/)[0];
  assert.match(tel, /radial-gradient\(circle at 50% 26%/, "the call key is a glossy sphere");
  assert.match(tel, /var\(--gold-2\)/, "it is gold");
});
