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
  assert.match(root, /--muted:color-mix\(in srgb,var\(--fg\) 58%,var\(--bg\)\)/, "muted derives from ink and ground");
  assert.match(root, /--ease:cubic-bezier\(\.2,\.7,\.2,1\)/, "the shared easing curve");
  assert.match(css, /:root\[data-theme="dark"\]\{[^}]*--bg:#111110/, "a dark finish is available on request");
});

test("the type scale is clamped and fluid", async () => {
  const css = await read("src/site/assets/site.css");
  const display = css.match(/\.display\{[^}]*\}/)[0];
  assert.match(display, /clamp\(44px,7vw,120px\)/, "the display size is fluid");
  const h2 = css.match(/\.s h1,\.s h2\{[^}]*\}/)[0];
  assert.match(h2, /clamp\(/, "section heads scale with the viewport");
  const hero = css.match(/\.hero-h1\{[^}]*\}/)[0];
  assert.match(hero, /font-weight:500/, "the hero headline is medium weight");
  assert.match(hero, /letter-spacing:-\.04/, "the hero headline is tightly set");
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

test("the wordmark and footer close the page", async () => {
  const css = await read("src/site/assets/site.css");
  const mark = css.match(/\.wordmark\{[^}]*\}/)[0];
  assert.match(mark, /font-size:clamp\(72px,23vw,360px\)/, "the wordmark is a large, fluid lockup");
  assert.match(mark, /white-space:nowrap/, "the lockup never wraps");
  const html = await read("dist/index.html");
  assert.match(html, /<p class="wordmark" aria-hidden="true">ai-ulu<\/p>/, "the footer carries the lockup");
});

// The nav CTA rides inside the pill header, so it must not inherit the solid
// .btn fill: a dark fill with dark text made the label invisible until hover.
test("the header CTA paints its own background so the label stays readable", async () => {
  const css = await read("src/site/assets/site.css");
  const cta = css.match(/\.nav-cta\{[^}]*\}/)[0];
  assert.match(cta, /background:transparent/, "the header CTA clears the inherited solid fill");
  assert.match(cta, /color:var\(--fg\)!important/, "its label uses the ink colour");
  const hover = css.match(/\.nav-cta:hover\{[^}]*\}/)[0];
  assert.match(hover, /background:var\(--fg\)/, "on hover the fill flips to ink");
  assert.match(hover, /color:var\(--bg\)!important/, "and the label flips to the ground colour");
});
