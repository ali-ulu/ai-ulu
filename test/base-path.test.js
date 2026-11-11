import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeBase, applyBase, BASE_FILE_RE } from "../src/site/lib/base.mjs";

test("normalizeBase keeps a root base and normalises sub-paths", () => {
  assert.equal(normalizeBase("/"), "/");
  assert.equal(normalizeBase(""), "/");
  assert.equal(normalizeBase(undefined), "/");
  assert.equal(normalizeBase("/ai-ulu"), "/ai-ulu/");
  assert.equal(normalizeBase("ai-ulu/"), "/ai-ulu/");
  assert.equal(normalizeBase("//ai-ulu//"), "/ai-ulu/");
});

test("applyBase is a no-op at the root", () => {
  const html = `<a href="/blog/">x</a><link href="/site.css">`;
  assert.equal(applyBase(html, "/"), html);
});

test("applyBase prefixes root-absolute hrefs, srcs and CSS urls", () => {
  const html = `<a href="/blog/">x</a><img src="/og.png"><link href="/site.css"><style>a{background:url(/img/gulus.webp)}</style>`;
  const out = applyBase(html, "/ai-ulu/");
  assert.match(out, /href="\/ai-ulu\/blog\/"/);
  assert.match(out, /src="\/ai-ulu\/og\.png"/);
  assert.match(out, /href="\/ai-ulu\/site\.css"/);
  assert.match(out, /url\(\/ai-ulu\/img\/gulus\.webp\)/);
});

test("applyBase leaves absolute, protocol-relative, data and hash URLs alone", () => {
  const html = `<a href="https://wa.me/905079581642">w</a><a href="//cdn.example/x">p</a><a href="#sss">h</a><img src="data:image/png;base64,AA">`;
  assert.equal(applyBase(html, "/ai-ulu/"), html);
});

test("applyBase rewrites the client-side /api/ calls and the manifest", () => {
  const js = `fetch("/api/lead")`;
  assert.match(applyBase(js, "/ai-ulu/"), /"\/ai-ulu\/api\/lead"/);
  const manifest = `{"start_url":"/","scope":"/","icons":[{"src":"/icon-192.png"}]}`;
  const out = applyBase(manifest, "/ai-ulu/");
  assert.match(out, /"start_url": "\/ai-ulu\/"/);
  assert.match(out, /"scope": "\/ai-ulu\/"/);
  assert.match(out, /"src": "\/ai-ulu\/icon-192\.png"/);
});

test("the base pass only touches text output kinds", () => {
  for (const name of ["index.html", "site.css", "app.js", "sitemap.xml", "robots.txt", "manifest.webmanifest"]) {
    assert.ok(BASE_FILE_RE.test(name), `${name} should be rewritten`);
  }
  for (const name of ["og.png", "gulus.webp", "font.woff2", "favicon.ico"]) {
    assert.ok(!BASE_FILE_RE.test(name), `${name} should be left alone`);
  }
});
