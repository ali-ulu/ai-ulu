import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import axe from "axe-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, "dist", rel), "utf8");

// Pages that are static HTML in dist/. The gallery (/sablonlar/) is a React app
// whose a11y is covered by its own component tests, not by a no-JS axe run.
const PAGES = [
  "index.html",
  "404.html",
  "blog/index.html",
  "blog/yapay-zeka-aramalarinda-gorunmek/index.html",
  "calismalar/index.html",
  "gizlilik/index.html",
  "kullanim-sartlari/index.html",
];

// Run axe in a jsdom window. Only rules that do not need layout/paint are
// meaningful here (jsdom does not compute visual styles), so the colour-contrast
// family is disabled; contrast is pinned separately by the CSS token test.
async function audit(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true, runScripts: "outside-only" });
  const { window } = dom;
  window.eval(axe.source);
  return window.axe.run(window.document, {
    rules: {
      "color-contrast": { enabled: false },
      "color-contrast-enhanced": { enabled: false },
    },
  });
}

for (const page of PAGES) {
  test(`${page} has no axe violations`, async () => {
    const { violations } = await audit(await read(page));
    const summary = violations
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× — ${v.nodes[0]?.html?.slice(0, 80)}`)
      .join("\n");
    assert.equal(violations.length, 0, `axe violations on ${page}:\n${summary}`);
  });
}

test("every page has exactly one <h1>", async () => {
  for (const page of PAGES) {
    const dom = new JSDOM(await read(page));
    const h1 = dom.window.document.querySelectorAll("h1");
    assert.equal(h1.length, 1, `${page} should have exactly one <h1>, found ${h1.length}`);
  }
});
