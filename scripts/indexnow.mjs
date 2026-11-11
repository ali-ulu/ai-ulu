// Submit the built sitemap URLs to IndexNow (Bing, Yandex and partners).
// Google retired its sitemap ping endpoint; use Search Console for Google.
// Runs after deploy; use --dry-run to print what would be sent.
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../src/site/config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

const sitemap = await readFile(join(root, "dist", "sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (urlList.length === 0) {
  console.error("sitemap.xml içinde <loc> bulunamadı; önce `npm run build` çalıştırın.");
  process.exit(1);
}

const payload = {
  host: new URL(site.url).host,
  key: site.indexNowKey,
  keyLocation: `${site.url}/${site.indexNowKey}.txt`,
  urlList,
};

if (dryRun) {
  console.log(`[dry-run] IndexNow'a gönderilecek ${urlList.length} URL:`);
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

// IndexNow returns 200 or 202 on success; 422 usually means a bad key file.
console.log(`IndexNow: HTTP ${res.status} (${urlList.length} URL)`);
if (!res.ok) {
  console.error((await res.text()).slice(0, 500));
  process.exit(1);
}
