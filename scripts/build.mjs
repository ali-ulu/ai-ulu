import { mkdir, writeFile, rm, cp, access, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";
import { pages, renderPage, notFoundPage } from "../src/site/pages.mjs";
import { site } from "../src/site/config.mjs";
import { applyBase, BASE_FILE_RE } from "../src/site/lib/base.mjs";
import { robotsTxt } from "../src/site/robots.mjs";
import { faq } from "../src/site/content/site-content.mjs";
import { byDateDesc } from "../src/site/components/blog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const assets = join(root, "src", "site", "assets");
// Built by `npm run build -w @ai-ulu/sablonlar` (root `npm run build` runs it first).
const gallery = join(root, "apps", "sablonlar", "dist");

async function write(rel, content) {
  const target = join(dist, rel);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

// Minify the hand-written CSS and JS in place. Files that ship already minified
// (three.js, the Vite bundle) are left alone, as is fonts.css, whose @font-face
// rules are tiny and read better unminified.
const MINIFY_CSS = ["site.css", "blog.css", "faq-drawer.css", "postmark-form.css", "print.css", "work.css"];
const MINIFY_JS = ["app.js", "liquid.js"];

async function minify(rel, loader) {
  const target = join(dist, rel);
  const source = await readFile(target, "utf8");
  const { code } = await transform(source, { loader, minify: true, legalComments: "none", target: "esnext" });
  await writeFile(target, code, "utf8");
}

async function build() {
  try {
    await access(join(gallery, "index.html"));
  } catch {
    throw new Error("apps/sablonlar/dist yok: önce `npm run build -w @ai-ulu/sablonlar` çalıştırın.");
  }
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  // GitHub Pages runs Jekyll over a branch-published site unless this file is
  // present, and Jekyll drops files and folders whose names start with "_".
  await writeFile(join(dist, ".nojekyll"), "", "utf8");

  for (const p of pages) await write(p.file, renderPage(p));
  await write(notFoundPage.file, renderPage(notFoundPage));
  await cp(assets, dist, { recursive: true });
  await cp(gallery, join(dist, "sablonlar"), { recursive: true });

  for (const rel of MINIFY_CSS) await minify(rel, "css");
  for (const rel of MINIFY_JS) await minify(rel, "js");

  await write("robots.txt", robotsTxt(site));

  // Web app manifest: installable shell and the icons browsers expect.
  await write(
    "manifest.webmanifest",
    JSON.stringify(
      {
        name: `${site.name} — ${site.title.split(" — ")[1] ?? "Web siteleri"}`,
        short_name: site.name,
        description: site.description,
        lang: site.lang,
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ebe9e5",
        theme_color: "#ebe9e5",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      null,
      2,
    ) + "\n",
  );

  // IndexNow ownership proof: the file must be served at /<key>.txt.
  await write(`${site.indexNowKey}.txt`, `${site.indexNowKey}\n`);

  const paths = [...pages.map((p) => p.path), "/sablonlar/"];
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${site.updated}</lastmod></url>`).join("\n")}
</urlset>
`);

  // GEO: a plain summary AI assistants can quote.
  await write("llms.txt", `# ${site.name}

> ${site.description}

## Sayfalar
- [Ana sayfa](${site.url}/): hizmetler, süreç, paketler, SSS ve iletişim formu
- [Çalışmalar](${site.url}/calismalar/): ai-ulu'nun kendi geliştirdiği açık kaynak yazılımlar ve başka platformlarda yayınlanmış yazılar
- [Örnek tasarımlar](${site.url}/sablonlar/): sektöre göre site tarzı örnekleri
- [Blog](${site.url}/blog/): web sitesi fiyatı, arama görünürlüğü ve müşteri kazanma üzerine yazılar
- [Gizlilik ve KVKK](${site.url}/gizlilik/)
- [Kullanım şartları](${site.url}/kullanim-sartlari/): hizmet kapsamı, ödeme, fikri mülkiyet ve sorumluluk

## Blog yazıları
${byDateDesc.map((p) => `- [${p.title}](${site.url}/blog/${p.slug}/): ${p.description}`).join("\n")}

## Hizmetler
- Tanıtım sitesi: markaya özel tasarım, hızlı açılış, Google ve yapay zekâ aramalarına hazır yapı
- Özel web uygulaması: panel, portal, randevu, sipariş, otomasyon
- Site + uygulama: tek tasarım dili, tek ekip
- Fiyat listesi yok; ücretsiz görüşmeden sonra 24 saat içinde yazılı teklif

## İletişim
- E-posta: ${site.email}
- Telefon / WhatsApp: ${site.phoneDisplay}

## SSS
${faq.items.map((f) => `- ${f.q} ${f.a}`).join("\n")}
`);

  // Security headers. CSP stays 'self'-only unless Turnstile is switched on (a site
  // key set in config), in which case the widget's script and iframe are allowed.
  const turnstile = Boolean(site.turnstileSiteKey);
  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    turnstile ? "script-src 'self' https://challenges.cloudflare.com" : "script-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    ...(turnstile ? ["frame-src https://challenges.cloudflare.com"] : []),
  ].join("; ");
  const immutable = "  Cache-Control: public, max-age=31536000, immutable";
  const week = "  Cache-Control: public, max-age=604800";
  // Root CSS/JS ship unhashed, so they get a week (not a year) plus a revalidation
  // window: a deploy is picked up quickly without a per-request round trip.
  const revalidate = "  Cache-Control: public, max-age=604800, stale-while-revalidate=86400";
  await write("_headers", `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/fonts/*
${immutable}

/sablonlar/assets/*
${immutable}

/site.css
${revalidate}

/blog.css
${revalidate}

/faq-drawer.css
${revalidate}

/postmark-form.css
${revalidate}

/print.css
${revalidate}

/work.css
${revalidate}

/app.js
${revalidate}

/liquid.js
${revalidate}

/img/*
${week}

/sablonlar/stiller/*
${week}

/og.png
${week}

/favicon.svg
${week}

/favicon.ico
${week}

/apple-touch-icon.png
${week}

/icon-192.png
${week}

/icon-512.png
${week}

/manifest.webmanifest
${week}
`);

  console.log(`✓ build: ${pages.length} sayfa + örnek tasarımlar + assets → dist/`);
}

// Rewrite root-absolute references to carry the base path. Runs last, after the
// minifiers, so it sees the final bytes. base "/" leaves the output untouched.
async function rewriteBase() {
  if (site.base === "/") return;
  let touched = 0;
  async function* walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(full);
      else if (BASE_FILE_RE.test(entry.name)) yield full;
    }
  }
  for await (const file of walk(dist)) {
    const before = await readFile(file, "utf8");
    const after = applyBase(before, site.base);
    if (after !== before) {
      await writeFile(file, after, "utf8");
      touched++;
    }
  }
  console.log(`✓ base "${site.base}": ${touched} dosya yeniden yazıldı`);
}

build()
  .then(rewriteBase)
  .catch((err) => {
    console.error("build failed:", err);
    process.exit(1);
  });
