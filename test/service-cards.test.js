import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("service cards are detached glass tiles, not a hairline grid", async () => {
  const css = await read("src/site/assets/site.css");
  const grid = css.match(/\.grid\{[^}]*\}/)[0];
  assert.match(grid, /gap:1\.1rem/, "cards must be separated by a real gap");
  assert.doesNotMatch(grid, /background:var\(--line\)/, "must not paint the hairline grid background");
  const cell = css.match(/\.cell\{[^}]*\}/)[0];
  assert.match(cell, /border-radius:18px/, "cards need rounded corners");
  assert.match(cell, /backdrop-filter:blur\(/, "cards must be glass");
  assert.match(cell, /linear-gradient\(163deg/, "cards need the corner light wash");
});

test("service cards glow from above on hover", async () => {
  const css = await read("src/site/assets/site.css");
  assert.match(css, /\.cell:hover\{[^}]*transform:translateY\(-4px\)/, "hover must lift the card");
  assert.match(css, /\.cell:hover::before\{opacity:1\}/, "hover must reveal the top glow");
  assert.match(css, /\.cell::before\{[^}]*radial-gradient\(130% 90% at 50% 0%/, "glow originates at the top");
});

test("the number label is a pill and the highlighted card is amber", async () => {
  const css = await read("src/site/assets/site.css");
  assert.match(css, /\.cell \.n\{[^}]*border-radius:999px/, "number label must be a pill");
  assert.match(css, /\.cell\.hi\{[^}]*rgba\(224,164,88/, "highlighted card must use the amber accent");
});

test("cards fall back to an opaque fill without backdrop-filter", async () => {
  const css = await read("src/site/assets/site.css");
  assert.match(css, /@supports not \(/, "cards need a no-backdrop-filter fallback");
  assert.match(css, /rgba\(14,16,20,\.9\)/, "fallback must be an opaque fill");
});
