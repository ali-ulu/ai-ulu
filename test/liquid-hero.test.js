import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("the home page renders the liquid-particle hero", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<section class="hero" id="hero" data-gl="off">/, "the hero starts without GL and is upgraded in place");
  assert.match(html, /<canvas id="liquid" aria-hidden="true"><\/canvas>/, "the hero holds the particle canvas");
  assert.match(html, /<script type="module" src="\/liquid\.js">/, "the home page loads the particle module");
  // Sub-pages keep the light page but never carry the hero canvas.
  const privacy = await read("dist/gizlilik/index.html");
  assert.doesNotMatch(privacy, /id="liquid"/, "only the home page has the canvas");
  assert.doesNotMatch(privacy, /liquid\.js/, "only the home page loads the module");
});

test("the hero canvas is a background layer behind the copy", async () => {
  const css = await read("src/site/assets/site.css");
  const stage = css.match(/\.hero-stage\{[^}]*\}/)[0];
  assert.match(stage, /position:absolute/, "the stage is positioned inside the hero");
  assert.match(stage, /z-index:0/, "the canvas sits behind the content");
  assert.match(stage, /pointer-events:none/, "the canvas must not intercept clicks");
  const content = css.match(/\.hero-content\{[^}]*\}/)[0];
  assert.match(content, /z-index:2/, "the copy stacks above the canvas");
  // The canvas only becomes visible once WebGL2 is confirmed.
  assert.match(css, /\.hero\[data-gl="on"\] \.hero-stage canvas\{opacity:1\}/, "the canvas fades in only when GL is on");
});

test("the particle module is WebGL2, reduced-motion aware and self-contained", async () => {
  const js = await read("src/site/assets/liquid.js");
  assert.match(js, /getContext\("webgl2"/, "must request a WebGL2 context");
  assert.match(js, /EXT_color_buffer_float/, "must verify float render targets before running");
  assert.match(js, /prefers-reduced-motion: reduce/, "must honour reduced motion");
  assert.match(js, /canvas\.remove\(\)/, "must remove the canvas when WebGL2 is unavailable");
  assert.match(js, /requestAnimationFrame\(frame\)/, "animates on the frame clock");
  assert.doesNotMatch(js, /https?:\/\//, "must not pull any external resource (CSP is 'self' only)");
});

test("the header is a fixed glass bar that is not a flat fill", async () => {
  const css = await read("src/site/assets/site.css");
  const header = css.match(/\.site-header\{[^}]*\}/)[0];
  assert.match(header, /position:fixed/, "the bar stays put while scrolling");
  assert.match(header, /justify-content:space-between/, "brand and nav sit at the ends");
  const stuck = css.match(/\.site-header\.is-stuck\{[^}]*\}/)[0];
  assert.match(stuck, /backdrop-filter:blur\(/, "it frosts what scrolls behind it");
  assert.match(stuck, /saturate\(/, "it saturates the glass");
  assert.match(css, /@supports not \([^)]*backdrop-filter/, "it needs a fallback when backdrop-filter is unsupported");
});

// A field that only reacts to the pointer reads as a still image on a phone or
// on first load. The ambient drift is what keeps it alive, so it is pinned here.
test("the particle field drifts without any pointer input", async () => {
  const js = await read("src/site/assets/liquid.js");
  assert.match(js, /vec2 ambientField\(vec2 uv, float t\)/, "the field needs a time-driven noise field");
  assert.match(js, /ambientField\(hm\.xy \/ uRes, uTime \+ hm\.z \* 4\.0\)/, "the drift is sampled at draw time, off the cursor");
  const draw = js.match(/const VS_DRAW = `[\s\S]*?`;/)[0];
  assert.match(draw, /uTime/, "the draw pass receives the clock");
  assert.match(draw, /uAmbient/, "the draw pass receives the ambient amount");
  assert.match(js, /gl\.uniform1f\(draw\.u\.uAmbient, reduce \? 0 : 1\)/, "reduced motion turns the drift off");
  // The sim's own turbulence must be fast enough to read as motion.
  assert.match(js, /vec2 q = p \* 0\.006 \+ vec2\(uTime \* 0\.35, -uTime \* 0\.20\)/, "the curl field scrolls at a visible rate");
});
