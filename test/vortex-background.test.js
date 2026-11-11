import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("vortex background loads on every page", async () => {
  for (const rel of ["dist/index.html", "dist/gizlilik/index.html"]) {
    const html = await read(rel);
    assert.match(html, /<script type="module" src="\/vortex\.js">/, `${rel} must load vortex.js`);
    assert.match(html, /<canvas id="vortex"/, `${rel} must contain the vortex canvas`);
  }
});

test("the vortex is a fixed background layer, never in front of content", async () => {
  const css = await read("src/site/assets/site.css");
  const rule = css.match(/#vortex\{[^}]*\}/)[0];
  assert.match(rule, /position:fixed/, "must be fixed so it covers the whole site");
  assert.match(rule, /z-index:-1/, "must sit behind the page content");
  assert.match(rule, /pointer-events:none/, "must not intercept clicks");
  // The 3D film stage must stay transparent so the vortex shows through.
  const stage = css.match(/\.stage\{[^}]*\}/)[0];
  assert.doesNotMatch(stage, /background:/, "stage must not paint over the vortex");
});

test("the navbar is frosted glass", async () => {
  const css = await read("src/site/assets/site.css");
  const nav = css.match(/\.nav-glass\{[^}]*\}/)[0];
  assert.match(nav, /backdrop-filter:blur\(/, "must blur what is behind it");
  assert.match(nav, /saturate\(/, "must saturate the glass");
  assert.doesNotMatch(nav, /background:rgba\(1[0-9],/, "must not be a flat dark fill");
});

test("vortex module degrades gracefully", async () => {
  const js = await read("src/site/assets/vortex.js");
  assert.match(js, /getContext\("webgl"/, "must request a WebGL context");
  assert.match(js, /prefers-reduced-motion: reduce/, "must honour reduced motion");
  assert.match(js, /canvas\.remove\(\)/, "must remove the canvas when WebGL is unavailable");
  assert.doesNotMatch(js, /https?:\/\//, "must not pull any external resource (CSP is 'self' only)");
});
