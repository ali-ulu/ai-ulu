import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("the home page renders the scroll film over the particle ground", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<div class="hero" id="film">/, "the film is the home hero");
  assert.match(html, /<canvas id="liquid" aria-hidden="true"><\/canvas>/, "the particle ground keeps its canvas");
  assert.match(html, /<canvas id="gl" aria-hidden="true"><\/canvas>/, "the 3D film renders to its own canvas");
  assert.match(html, /<script type="module" src="\/liquid\.js">/, "the home page loads the particle module");
  assert.match(html, /<script type="module" src="\/ora\.js">/, "the home page loads the film module");
  // Sub-pages keep the light page but never carry the hero canvases.
  const privacy = await read("dist/gizlilik/index.html");
  assert.doesNotMatch(privacy, /id="liquid"/, "only the home page has the particle canvas");
  assert.doesNotMatch(privacy, /id="gl"/, "only the home page has the film canvas");
  assert.doesNotMatch(privacy, /liquid\.js/, "only the home page loads the module");
});

test("the hero canvases are background layers behind the copy", async () => {
  const css = await read("src/site/assets/site.css");
  const stage = css.match(/\.hero-stage\{[^}]*\}/)[0];
  assert.match(stage, /position:absolute/, "the stage is positioned inside the hero");
  assert.match(stage, /z-index:0/, "the particle ground sits behind the content");
  assert.match(stage, /pointer-events:none/, "the canvas must not intercept clicks");
  const gl = css.match(/#gl\{[^}]*\}/)[0];
  assert.match(gl, /z-index:1/, "the film canvas sits above the ground, below the copy");
  const chapter = css.match(/\.ch\{[^}]*\}/)[0];
  assert.match(chapter, /z-index:3/, "the copy stacks above both canvases");
  // The particle canvas only becomes visible once WebGL2 is confirmed.
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

// The home hero is a scroll-scrubbed film, not a static header. Its structure is
// what ora.js drives, so the contract is pinned here.
test("the film carries the scroll chapters, tags and progress rail", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<div class="hero" id="film">/, "the film wrapper keeps its id for ora.js");
  const chapters = [...html.matchAll(/class="ch(?: right)?" id="c\d" data-a="[^"]+" data-b="[^"]+"/g)];
  assert.equal(chapters.length, 5, "five chapters, each with a scroll window");
  assert.match(html, /<div class="prog" aria-hidden="true"><i><\/i><i><\/i><i><\/i><i><\/i><i><\/i><\/div>/, "a five-tick progress rail");
  assert.equal([...html.matchAll(/<div class="tag" aria-hidden="true">/g)].length, 4, "four anchored tags");
  assert.match(html, /<div class="hint" id="hint" aria-hidden="true">Kaydırın<\/div>/, "the scroll hint is labelled for ora.js");
});

test("the film degrades to a plain column without WebGL or JavaScript", async () => {
  const css = await read("src/site/assets/site.css");
  const flat = css.match(/\.no-3d #film\{[^}]*\}/)[0];
  assert.match(flat, /height:auto/, "the film collapses to natural height");
  const flatCh = css.match(/\.no-3d \.ch\{[^}]*\}/)[0];
  assert.match(flatCh, /position:static/, "chapters leave the sticky stage");
  assert.match(flatCh, /opacity:1/, "and are visible without the scroll driver");
  const js = await read("src/site/assets/ora.js");
  assert.match(js, /classList\.add\('no-3d'\)/, "ora.js applies the same fallback at runtime");
  const html = await read("dist/index.html");
  assert.match(html, /<noscript><style>/, "a no-JS stylesheet ships in the head");
});

test("the film loads three.js locally and stays inside the CSP", async () => {
  const js = await read("src/site/assets/ora.js");
  // The typed code sample mentions a wa.me URL; that is drawn text, not a fetch.
  assert.doesNotMatch(js, /import\((['"])?https?:/, "no remote module: three.js is served from the origin");
  assert.doesNotMatch(js, /fetch\(\s*(['"])https?:/, "no remote fetch");
  assert.doesNotMatch(js, /\b(src|href)\s*=\s*(['"])https?:/, "no remote script or stylesheet");
  assert.match(js, /new URL\('\.\/vendor\/three\/three\.module\.min\.js', import\.meta\.url\)/, "three resolves relative to the module, so it works under any base path");
  assert.match(js, /new URL\('\.\/img\/gulus\.webp', import\.meta\.url\)/, "the screen photo is origin-relative too");
  // three.js must not need eval, which the 'self'-only CSP would block.
  const three = await read("dist/vendor/three/three.module.min.js");
  assert.doesNotMatch(three, /new Function\(/, "three.js must not construct code at runtime");
});
