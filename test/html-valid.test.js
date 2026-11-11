import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { HtmlValidate } from "html-validate";
import config from "../htmlvalidate.config.mjs";
import { pages, renderPage } from "../src/site/pages.mjs";
import { posts } from "../src/site/content/blog.mjs";

// Validates the markup the generator produces, so a broken tag fails here rather
// than in a browser. The rendered pages are validated directly (no build needed).
const validator = new HtmlValidate(config);

// Human-readable list of the validator's complaints, for assertion messages.
function describe(report) {
  return report.results
    .flatMap((r) => r.messages.map((m) => `  ${r.filePath}:${m.line}:${m.column} ${m.ruleId} ${m.message}`))
    .join("\n");
}

function htmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlFiles(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

test("every generated page is valid HTML", async () => {
  for (const p of pages) {
    const report = await validator.validateString(renderPage(p));
    assert.ok(
      report.valid,
      `${p.path} is not valid HTML:\n${describe(report)}`,
    );
  }
});

test("the built site is valid HTML", async () => {
  // dist/ is produced by `npm run build`; skip cleanly when it has not run.
  let files;
  try {
    files = htmlFiles("dist");
  } catch {
    return;
  }
  for (const file of files) {
    const report = await validator.validateString(readFileSync(file, "utf8"));
    assert.ok(
      report.valid,
      `${file} is not valid HTML:\n${describe(report)}`,
    );
  }
});

test("page titles fit the search result width", () => {
  // Google shows roughly 60 characters; the site appends " · ai-ulu" (9 chars).
  // Keep the visible title inside 70 so it is not truncated in results.
  const visible = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const subjects = [
    { name: "home", title: "Müşteri getiren web siteleri" },
    ...posts.map((p) => ({ name: p.slug, title: p.metaTitle || p.title })),
  ];
  for (const { name, title } of subjects) {
    const length = [...visible(`${title} · ai-ulu`)].length;
    assert.ok(length <= 70, `${name} <title> is ${length} chars, over 70`);
    assert.ok(length >= 20, `${name} <title> is only ${length} chars, too thin`);
  }
});

test("blog posts keep a full headline for the h1 and schema", () => {
  // A shortened metaTitle must never shrink the on-page headline.
  for (const p of posts) {
    if (!p.metaTitle) continue;
    assert.ok(p.title.length > p.metaTitle.length, `${p.slug}: metaTitle must be the shorter form`);
  }
});
