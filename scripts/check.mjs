import { access, readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../src/site/config.mjs";
import { pages, notFoundPage } from "../src/site/pages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// Pages come from the generator itself, so a new page is checked the moment it
// is added instead of when someone remembers to update this list.
const required = [
  ...pages.map((p) => p.file),
  notFoundPage.file,
  "sablonlar/index.html",
  "blog.css",
  "site.css",
  "work.css",
  "liquid.js",
  "app.js",
  "fonts/fonts.css",
  "og.png",
  "favicon.svg",
  "favicon.ico",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "manifest.webmanifest",
  "print.css",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "_headers",
  `${site.indexNowKey}.txt`,
];

let failed = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); failed++; };

for (const rel of required) {
  try {
    await access(join(dist, rel));
    console.log(`✓ ${rel}`);
  } catch {
    fail(`EKSİK: ${rel}`);
  }
}

// The CSP only allows this origin, so any third-party script/style/font/image URL would break in production.
async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else if (/\.(html|css)$/.test(entry.name)) yield full;
  }
}
const external = /(?:src|href)=["'](https?:)?\/\/(?!ai-ulu\.com)[^"']+["']|url\((["']?)(https?:)?\/\/[^)]+\)/g;
const allowedLink = /href=["']https:\/\/wa\.me\//;
for await (const file of files(dist)) {
  const text = await readFile(file, "utf8");
  for (const match of text.match(external) ?? []) {
    if (allowedLink.test(match)) continue;
    const isAsset = !match.startsWith("href=") || /\.(css|js|woff2?|png|jpe?g|webp|svg)["']/.test(match);
    if (isAsset) fail(`dış kaynak (CSP bunu engeller): ${match} → ${file.slice(dist.length + 1)}`);
  }
}

if (failed) {
  console.error(`\n${failed} sorun var. Önce "npm run build" çalıştırın ve düzeltin.`);
  process.exit(1);
}
console.log("\n✓ Tüm beklenen çıktılar mevcut, dış kaynak yok.");
