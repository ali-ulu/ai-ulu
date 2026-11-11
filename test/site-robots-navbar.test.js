import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../src/site/config.mjs";
import { robotsTxt } from "../src/site/robots.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("robots.txt allows crawling, lists AI crawlers and the sitemap", () => {
  const txt = robotsTxt(site);
  assert.match(txt, /^User-agent: \*\nAllow: \/$/m, "must allow all crawlers");
  for (const bot of ["GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended"]) {
    assert.ok(txt.includes(`User-agent: ${bot}\nAllow: /`), `${bot} should be allowed`);
  }
  assert.ok(txt.includes(`Sitemap: ${site.url}/sitemap.xml`), "must point at the sitemap");
});

test("IndexNow key file matches the configured key", async () => {
  const body = (await read(`dist/${site.indexNowKey}.txt`)).trim();
  assert.equal(body, site.indexNowKey);
  assert.match(site.indexNowKey, /^[a-f0-9]{32}$/, "IndexNow key must be 32 hex chars");
});

test("every page renders one header with the brand and nav", async () => {
  for (const rel of ["dist/index.html", "dist/gizlilik/index.html"]) {
    const html = await read(rel);
    assert.match(html, /<header class="site-header">/, `${rel} should contain the header`);
    assert.equal((html.match(/class="site-header"/g) ?? []).length, 1, `${rel} should have exactly one header`);
    assert.match(html, /<a class="logo" href="\/"/, `${rel} should link the brand home`);
    assert.match(html, /class="theme-toggle"/, `${rel} should offer the theme toggle`);
  }
});

test("the fixed bar becomes glass once the page is scrolled", async () => {
  const css = await read("src/site/assets/site.css");
  assert.match(css, /\.site-header\{[^}]*position:fixed/, "the bar is fixed");
  assert.match(css, /\.site-header\.is-stuck\{[^}]*backdrop-filter:blur\(/, "the stuck bar frosts what is behind it");
  assert.match(css, /\.site-header\.is-stuck\{[^}]*saturate\(/, "and saturates the glass");
  assert.match(css, /@supports not \([^)]*backdrop-filter/, "needs a fallback when backdrop-filter is unsupported");
  // The toggle is driven by app.js adding/removing .is-stuck on scroll.
  const js = await read("src/site/assets/app.js");
  assert.match(js, /classList\.toggle\("is-stuck", window\.scrollY > 24\)/, "scroll drives the stuck state");
});
