import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { faq } from "../src/site/content/site-content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("the FAQ is a card-index drawer, not a plain list", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /id="sss"/, "the section keeps its #sss anchor");
  assert.match(html, /class="fq"/, "the drawer root is present");
  assert.match(html, /class="fq-drawer"/, "the drawer frame is present");
  assert.match(html, /class="fq-tray"/, "the card tray is present");
  assert.match(html, /class="fq-front"/, "the drawer front plate is present");
  assert.match(html, /class="fq-key"/, "the ask key is present");
  // every question is a card, and the cards share one `name` so only one opens.
  const cards = html.match(/<details class="fq-card" name="faq-drawer"/g) || [];
  assert.equal(cards.length, faq.items.length, "one card per question");
  assert.equal((html.match(/<summary class="fq-edge"/g) || []).length, faq.items.length);
});

test("the first card opens by default and carries its tab, index and mark", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<details class="fq-card" name="faq-drawer" open style="--k:0;--depth:1\.000;--tab-at:0\.04"/, "the front card is open and placed");
  assert.match(html, /<span class="fq-tab" aria-hidden="true">Süre<\/span>/, "the tab names the subject");
  assert.match(html, /<span class="fq-no" aria-hidden="true">S\.01<\/span>/, "the card is indexed Q.01-style");
  assert.match(html, /class="fq-mark" aria-hidden="true"/, "the open/close mark is present");
  assert.match(html, /class="fq-filed" aria-hidden="true">Süre · S\.01</, "the filed note is present");
});

test("tabs sit at three staggered stations along the cards", async () => {
  const html = await read("dist/index.html");
  const stations = [...html.matchAll(/--tab-at:([\d.]+)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(stations)], ["0.04", "0.37", "0.7"], "three stations, repeating");
});

test("the drawer stylesheet keeps paper cards in a graphite frame", async () => {
  const css = await read("src/site/assets/faq-drawer.css");
  assert.match(css, /\.fq \{[\s\S]*?--fq-paper: #f3f0e7/, "the cards are warm paper");
  assert.match(css, /--fq-face: #17181b/, "the drawer is graphite");
  assert.match(css, /\.fq-tray \{[\s\S]*?box-shadow: var\(--fq-inset\)/, "the tray is a recess");
  assert.match(css, /\.fq-card\[open\] \{[\s\S]*?transform: translateY\(-12px\)/, "an open card is pulled out");
  assert.match(css, /\.fq-key \{[\s\S]*?--fq-cap-hi/, "the ask key wears the accent");
  // No embedded webfonts: the site's CSP is font-src 'self'.
  assert.doesNotMatch(css, /@font-face/, "no embedded fonts");
  assert.match(css, /--fq-sans: var\(--sans\)/, "type comes from the site's own faces");
});

test("the drawer re-composes by width and respects reduced motion", async () => {
  const css = await read("src/site/assets/faq-drawer.css");
  assert.match(css, /@container fq \(max-width: 959px\)/, "it has a container breakpoint");
  assert.match(css, /@container fq \(max-width: 559px\)/, "and a narrow one");
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*?\.fq-card:not\(\[open\]\):hover \{ transform: none; \}/, "motion is opt-out");
});

test("the home page loads the drawer stylesheet", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<link rel="stylesheet" href="\/faq-drawer\.css">/, "the page links its stylesheet");
  const privacy = await read("dist/gizlilik/index.html");
  assert.doesNotMatch(privacy, /faq-drawer\.css/, "other pages do not load it");
});
