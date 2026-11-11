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

test("every page renders the liquid-glass navbar pill", async () => {
  for (const rel of ["dist/index.html", "dist/gizlilik/index.html"]) {
    const html = await read(rel);
    assert.ok(html.includes('class="nav-glass"'), `${rel} should contain the glass pill`);
    assert.equal((html.match(/class="nav-glass"/g) ?? []).length, 1, `${rel} should have exactly one navbar`);
  }
});

test("site.css defines the glass navbar with a no-backdrop-filter fallback", async () => {
  const css = await read("src/site/assets/site.css");
  assert.match(css, /\.nav-glass\{[^}]*backdrop-filter:blur\(/, "pill needs a backdrop blur");
  assert.match(css, /\.nav-glass\{[^}]*border-radius:999px/, "pill needs a full radius");
  assert.match(css, /@supports not \([^)]*backdrop-filter/, "needs a fallback when backdrop-filter is unsupported");
});
