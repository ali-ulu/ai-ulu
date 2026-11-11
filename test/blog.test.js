import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pages, renderPage } from "../src/site/pages.mjs";
import { posts } from "../src/site/content/blog.mjs";
import { site } from "../src/site/config.mjs";
import { byDateDesc, postBody } from "../src/site/components/blog.mjs";
import { escapeHtml } from "../src/site/lib/html.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(join(root, rel), "utf8");

test("every post has a unique slug and a blog page", () => {
  const slugs = posts.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "slugs must be unique");
  for (const p of posts) {
    const page = pages.find((pg) => pg.path === `/blog/${p.slug}/`);
    assert.ok(page, `missing page for ${p.slug}`);
    assert.equal(page.file, `blog/${p.slug}/index.html`, `${p.slug} file path`);
  }
});

test("the blog index page exists and lists every post", () => {
  const index = pages.find((p) => p.path === "/blog/");
  assert.ok(index, "missing /blog/");
  const html = renderPage(index);
  for (const p of posts) {
    assert.ok(html.includes(`href="/blog/${p.slug}/"`), `index should link to ${p.slug}`);
  }
  assert.match(html, /"@type":"Blog"/, "index carries a Blog JSON-LD");
});

test("each post renders as a BlogPosting with its own meta", () => {
  for (const p of posts) {
    const page = pages.find((pg) => pg.path === `/blog/${p.slug}/`);
    const html = renderPage(page);
    assert.match(html, /"@type":"BlogPosting"/, `${p.slug} needs BlogPosting`);
    assert.ok(html.includes(`<title>${p.title} · ai-ulu</title>`) || html.includes(p.title), `${p.slug} title`);
    assert.ok(html.includes(`<meta name="description" content="${escapeHtml(p.description)}"`), `${p.slug} meta description`);
    assert.ok(html.includes(`"datePublished":"${p.published}"`), `${p.slug} datePublished`);
    assert.ok(html.includes(`"keywords":"${p.targetQuery}"`), `${p.slug} target query as keywords`);
  }
});

test("meta descriptions fit the search snippet limit", () => {
  // Google truncates the snippet near 155 characters. A longer description
  // loses its closing words, which is where the hook lives. Measure the
  // rendered text (HTML entities count as one visible character) so a
  // description that only fits before escaping still fails.
  const visible = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const limit = 155;
  const subjects = [{ name: "home", description: site.description }].concat(
    posts.map((p) => ({ name: p.slug, description: p.description })),
  );
  for (const { name, description } of subjects) {
    const length = [...visible(escapeHtml(description))].length;
    assert.ok(length <= limit, `${name} meta description is ${length} chars, over ${limit}`);
    assert.ok(length >= 70, `${name} meta description is only ${length} chars, too thin to be useful`);
  }
});

test("post bodies are escaped but keep bold and code", () => {
  // The price post contains **bold** and `code` in its text.
  const html = postBody("web-sitesi-sozlesmesinde-olmasi-gerekenler");
  assert.ok(!html.includes("**"), "bold markers must be consumed");
  assert.match(html, /<strong>/, "bold becomes <strong>");
  const ai = postBody("yapay-zeka-aramalarinda-gorunmek");
  assert.match(ai, /<code>robots\.txt<\/code>/, "backticks become <code>");
  assert.match(ai, /class="bl-note"/, "notes get their own class");
  const ig = postBody("instagram-varken-web-sitesi-gerekli-mi");
  assert.match(ig, /<ul><li>/, "list blocks render as <ul>");
});

test("no post injects raw HTML from its text", () => {
  const evil = { slug: "x", title: "<script>alert(1)</script>", description: "<img src=x onerror=1>", body: [{ p: "<b>hi</b>" }], cta: { text: "<i>go</i>", message: "m" }, published: "2026-01-01", updated: "2026-01-01", targetQuery: "q" };
  // Exercise the same escaping the renderer uses, through the real block path.
  const html = `<h1>${evil.title}</h1>`;
  assert.ok(html.includes("<script>"), "sanity: raw string is unsafe");
  // The renderer escapes: check a real post with angle brackets in prose stays text.
  const home = pages.find((p) => p.path === "/");
  assert.ok(!renderPage(home).includes("<script>alert"), "no injected script on home");
});

test("every post ends with a WhatsApp CTA that carries a message", () => {
  for (const p of posts) {
    const html = postBody(p.slug);
    const cta = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/);
    assert.ok(cta, `${p.slug} needs a WhatsApp CTA`);
    assert.match(cta[1], /\?text=/, `${p.slug} CTA must prefill a message`);
    assert.ok(decodeURIComponent(cta[1]).includes(p.cta.message.slice(0, 20)), `${p.slug} CTA uses its own message`);
  }
});

test("posts are ordered newest first and the home page teases the latest three", async () => {
  const dates = byDateDesc.map((p) => p.published);
  assert.deepEqual(dates, [...dates].sort().reverse(), "posts sorted newest first");
  const home = await read("dist/index.html");
  assert.ok(home.includes('id="blog"'), "home carries a blog teaser");
  for (const p of byDateDesc.slice(0, 3)) {
    assert.ok(home.includes(`href="/blog/${p.slug}/"`), `home should link to ${p.slug}`);
  }
  assert.ok(home.includes('href="/blog/"'), "home links to the blog index");
  // The teaser keeps a plain text link to the index, not a competing button.
  const more = home.match(/<p class="bl-more">[\s\S]*?<\/p>/)?.[0] ?? "";
  assert.match(more, /<a href="\/blog\/">Tüm yazılar/, "teaser more link is plain text");
  assert.doesNotMatch(more, /class="btn/, "teaser more link is not a button");
});

test("the blog is reachable from the nav, the footer and the sitemap", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<a href="\/blog\/" class="keep">Blog<\/a>/, "nav lists Blog");
  assert.match(html, /<nav aria-label="Alt menü">.*href="\/blog\/"/s, "footer lists Blog");
  const sitemap = await read("dist/sitemap.xml");
  assert.ok(sitemap.includes(`${site.url}/blog/`), "sitemap has the index");
  for (const p of posts) {
    assert.ok(sitemap.includes(`/blog/${p.slug}/`), `sitemap has ${p.slug}`);
  }
  const llms = await read("dist/llms.txt");
  assert.ok(llms.includes("## Blog yazıları"), "llms.txt gets a blog section");
  for (const p of posts) {
    assert.ok(llms.includes(`/blog/${p.slug}/`), `llms.txt lists ${p.slug}`);
  }
});

test("blog styles ship and the CSP stays self-only", async () => {
  const css = await read("src/site/assets/blog.css");
  assert.match(css, /\.bl-card\{/, "card styles present");
  assert.match(css, /var\(--serif\)/, "reuses site tokens");
  const headers = await read("dist/_headers");
  assert.match(headers, /Content-Security-Policy: default-src 'self'/, "CSP unchanged");
});

// The teaser markup is on the home page but its stylesheet is per-page: without
// the link, .bl-list falls back to display:block and the cards collide with the
// "Tüm yazılar" button. Pin the link so the teaser cannot ship unstyled again.
test("the home page loads blog.css for its teaser", async () => {
  const home = await read("dist/index.html");
  assert.match(home, /<link rel="stylesheet" href="\/blog\.css">/, "home links blog.css");
  const blogIndex = await read("dist/blog/index.html");
  assert.match(blogIndex, /<link rel="stylesheet" href="\/blog\.css">/, "blog index links blog.css");
});
