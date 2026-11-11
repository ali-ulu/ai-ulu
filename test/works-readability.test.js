import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

// Readability of the block stylesheets. The failure this guards against: using a
// surface token as a text colour, or a fixed dark card fill, which makes the text
// unreadable in one of the two themes. Contrast is measured for real in the
// Playwright sweep; these are the static invariants behind it.

test("site.css defines the semantic surface and text tokens", async () => {
  const css = await read("src/site/assets/site.css");
  const rootBlock = css.match(/:root\{[^}]*\}/)[0];
  for (const token of ["--surface:", "--surface-2:", "--text-2:", "--text-3:", "--accent:"]) {
    assert.ok(rootBlock.includes(token), `site.css must define ${token}`);
  }
  // The accent as text must flip with the ground, or it is unreadable in dark.
  const dark = css.match(/:root\[data-theme="dark"\]\{[^}]*\}/)[0];
  assert.match(dark, /--accent:/, "the dark theme must override the accent");
});

test("the block stylesheets never paint text with a surface token", async () => {
  for (const rel of ["src/site/assets/work.css", "src/site/assets/blog.css"]) {
    const css = await read(rel);
    assert.doesNotMatch(css, /color:var\(--soft\)/, `${rel} must not use --soft as a text colour`);
    assert.doesNotMatch(css, /color:var\(--dim\)/, `${rel} must not use the --dim alias as a text colour`);
  }
});

test("the block stylesheets do not hard-code a dark card fill", async () => {
  for (const rel of ["src/site/assets/work.css", "src/site/assets/blog.css"]) {
    const css = await read(rel);
    assert.doesNotMatch(css, /rgba\(14,16,20/, `${rel} must not hard-code the old dark card fill`);
    assert.doesNotMatch(css, /rgba\(236,231,222/, `${rel} must not hard-code light-on-dark hairlines`);
  }
});

test("the works cards take their fill from the surface token", async () => {
  const css = await read("src/site/assets/work.css");
  const item = css.match(/\.wk-item\{[^}]*\}/)[0];
  assert.match(item, /background:var\(--surface\)/, "the card fill must follow the theme");
  const article = css.match(/\.wk-article a\{[^}]*\}/)[0];
  assert.match(article, /background:var\(--surface\)/, "the article row must follow the theme");
});

// The dock is the always-available way to reach the owner: WhatsApp and a direct
// call, on every page. It replaced the phone-only text bar.
test("every page carries a contact dock with WhatsApp and a call link", async () => {
  const pages = [
    "dist/index.html",
    "dist/calismalar/index.html",
    "dist/blog/index.html",
    "dist/gizlilik/index.html",
  ];
  for (const rel of pages) {
    const html = await read(rel);
    assert.match(html, /<nav class="dock"/, `${rel} needs the contact dock`);
    assert.match(html, /class="dock-btn wa"[^>]*href="https:\/\/wa\.me\/905079581642/, `${rel} needs the WhatsApp button`);
    assert.match(html, /class="dock-btn tel"[^>]*href="tel:\+905079581642/, `${rel} needs the call button`);
  }
});

test("the dock buttons are labelled and carry an icon", async () => {
  const html = await read("dist/index.html");
  const dock = html.split('class="dock"')[1].split("</nav>")[0];
  assert.match(dock, /aria-label="WhatsApp/, "the WhatsApp button needs a label");
  assert.match(dock, /aria-label="Telefonla aray/, "the call button needs a label");
  assert.equal((dock.match(/<svg/g) ?? []).length, 2, "both buttons need an inline icon");
  assert.doesNotMatch(dock, /https?:\/\/(?!wa\.me)/, "the dock must not load external assets");
});

test("the contact dock is screen-only", async () => {
  const css = await read("src/site/assets/print.css");
  assert.match(css, /\.dock,/, "print.css must hide the dock");
});
