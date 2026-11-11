import { test } from "node:test";
import assert from "node:assert/strict";
import { pages, renderPage } from "../src/site/pages.mjs";
import { site } from "../src/site/config.mjs";

test("site.updated is an ISO date", () => {
  assert.match(site.updated, /^\d{4}-\d{2}-\d{2}$/);
});

test("every page carries freshness signals", () => {
  for (const p of pages) {
    const html = renderPage(p);
    assert.ok(html.includes('"dateModified"'), `${p.path} missing dateModified JSON-LD`);
    assert.ok(html.includes('property="og:updated_time"'), `${p.path} missing og:updated_time`);
    assert.ok(html.includes('"@type":"WebPage"'), `${p.path} missing WebPage JSON-LD`);
  }
});

test("the home page links to the works page as its proof section", () => {
  const home = pages.find((p) => p.path === "/");
  const body = renderPage(home).split('<main id="main">')[1].split("</main>")[0];
  // The agency has no client references yet; the works page carries that job, so
  // the home page must route visitors to it rather than leave it nav-only.
  assert.match(body, /<a href="\/calismalar\/">/, "home links to the works page in the body");
});

test("home page has at least 3 contextual links in the body", () => {
  const home = pages.find((p) => p.path === "/");
  const body = renderPage(home).split('<main id="main">')[1].split("</main>")[0];
  const internal = (body.match(/<a [^>]*href="(\/[^"]*|#[\w-]+)"/g) || []).length;
  assert.ok(internal >= 3, `expected >= 3 contextual body links, found ${internal}`);
});
