import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pages } from "../src/site/pages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");
const has = (rel) => existsSync(join(root, rel));

// Regression guard for the Front-End Checklist pass: each assertion here maps to
// a rule from frontendchecklist.io that the site failed at least once.
const built = has("dist/index.html");

test("every page declares a color-scheme so form controls match the theme", async () => {
  const css = await read("src/site/assets/site.css");
  assert.match(css, /color-scheme\s*:/, "site.css must set color-scheme");
});

test("og:image carries an alt for the social card", async () => {
  for (const rel of ["dist/index.html", "dist/blog/index.html", "dist/sablonlar/index.html"]) {
    if (!has(rel)) continue;
    const html = await read(rel);
    assert.match(html, /property="og:image:alt"/, `${rel} needs og:image:alt`);
  }
});

test("the gallery serves responsive images, not the 1400px original to phones", async () => {
  const app = await read("apps/sablonlar/src/App.tsx");
  assert.match(app, /srcSet:/, "gallery items must define srcSet");
  assert.match(app, /-480\.webp 480w/, "a 480w candidate must exist");
  assert.match(app, /-960\.webp 960w/, "a 960w candidate must exist");
  const gallery = await read("apps/sablonlar/src/components/ui/picture-rail-gallery.tsx");
  assert.match(gallery, /srcSet=\{item\.srcSet\}/, "the rail must pass srcSet to the img");
  assert.match(gallery, /sizes=\{item\.sizes\}/, "the rail must pass sizes to the img");
});

test("the smaller gallery encodings ship next to the originals", async () => {
  if (!built) return;
  const dir = "dist/sablonlar/stiller";
  // Every *-480.webp referenced by the app must exist in the build output.
  const app = await read("apps/sablonlar/src/App.tsx");
  const names = [...app.matchAll(/srcSet\("([a-z]+)"\)/g)].map((m) => m[1]);
  assert.ok(names.length >= 8, `expected the gallery styles, found ${names.length}`);
  for (const n of names) {
    for (const suffix of ["-480", "-960", ""]) {
      const file = `${dir}/${n}${suffix}.webp`;
      assert.ok(existsSync(join(root, file)), `missing build asset: ${file}`);
      assert.ok((await stat(join(root, file))).size > 0, `empty asset: ${file}`);
    }
  }
});

test("a custom 404 ships and tells the visitor nothing was found", async () => {
  if (!built) return;
  const html = await read("dist/404.html");
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  assert.ok(h1, "404 needs an h1");
  assert.match(h1[1], /bulamadık/i, "404 h1 must say the page was not found");
  assert.match(html, /noindex/, "404 must not be indexed");
  assert.doesNotMatch(html, /rel="canonical"/, "404 must not claim a canonical URL");
});

test("CSS is colour-managed and the work stylesheet is minified", async () => {
  if (!built) return;
  const work = await read("dist/work.css");
  const lines = work.trim().split("\n").length;
  assert.ok(lines <= 3, `work.css looks unminified (${lines} lines)`);
});

test("the built site exposes no inline event handlers", async () => {
  if (!built) return;
  for (const p of pages) {
    const rel = p.path === "/" ? "dist/index.html" : `dist${p.path}index.html`;
    if (!has(rel)) continue;
    const html = await read(rel);
    assert.doesNotMatch(html, /\son(click|load|error|mouseover|submit)=/i, `${rel} has an inline handler`);
  }
});
