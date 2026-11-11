import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products, articles } from "../src/site/content/work.mjs";
import { pages, renderPage } from "../src/site/pages.mjs";
import { site } from "../src/site/config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("the calismalar page is built and registered", async () => {
  const page = pages.find((p) => p.path === "/calismalar/");
  assert.ok(page, "/calismalar/ must be a registered page");
  const html = await read("dist/calismalar/index.html");
  assert.ok(html.includes(`rel="canonical" href="${site.url}/calismalar/"`), "canonical must point at the page");
});

test("every product is linked and named in the built page", async () => {
  const html = await read("dist/calismalar/index.html");
  for (const p of products) {
    assert.ok(html.includes(p.name), `product name missing: ${p.name}`);
    for (const l of p.links) {
      assert.ok(html.includes(`href="${l.href}"`), `missing link for ${p.name}: ${l.href}`);
    }
  }
});

test("every article links to its original platform, not a local copy", async () => {
  const html = await read("dist/calismalar/index.html");
  for (const a of articles) {
    assert.ok(html.includes(`href="${a.href}"`), `missing article link: ${a.href}`);
    // Republishing would compete with the original, so there must be no local post.
    assert.ok(!html.includes(`href="/blog/${a.href.split("/").pop()}"`), "articles must not be copied into the blog");
  }
});

test("the calismalar JSON-LD names each product as software", async () => {
  const html = await read("dist/calismalar/index.html");
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const flat = JSON.stringify(ld);
  assert.ok(flat.includes('"@type":"SoftwareApplication"'), "products should be SoftwareApplication");
  assert.ok(flat.includes('"@type":"ItemList"'), "articles should be an ItemList");
  assert.ok(flat.includes('"@type":"CollectionPage"'), "the page itself should be a CollectionPage");
});

test("the calismalar page is reachable from the nav and footer", () => {
  const home = renderPage(pages.find((p) => p.path === "/"));
  assert.ok(home.includes('href="/calismalar/"'), "nav or footer must link to /calismalar/");
});

test("external links carry rel=noopener and open safely", async () => {
  const html = await read("dist/calismalar/index.html");
  const external = html.match(/<a [^>]*href="https?:\/\/[^"]*"[^>]*>/g) ?? [];
  const ours = external.filter((a) => !a.includes("wa.me"));
  assert.ok(ours.length >= products.length + articles.length, "expected every product and article link");
  for (const a of ours) {
    assert.ok(a.includes('rel="noopener"'), `external link needs rel=noopener: ${a}`);
  }
});

// The intro presents finished work. It must not apologise for missing client
// references, and it must never mention why client work is held back: naming the
// permission question on the page would tell visitors we have work we hide.
test("the works intro presents the products without apologising", async () => {
  const html = await read("dist/calismalar/index.html");
  const intro = html.split('class="wk-intro"')[1].split("</header>")[0];
  assert.match(intro, /Kendi yazdığım/, "the intro keeps its headline");
  assert.doesNotMatch(intro, /referans/i, "no reference framing in the intro");
  // \b so the common word "sizin" does not read as "izin".
  assert.doesNotMatch(intro, /\bizin\b|\bpermission\b/i, "the permission question stays off the page");
  assert.doesNotMatch(intro, /henüz yok|\byeni\b/i, "the intro does not lead with what is missing");
});
