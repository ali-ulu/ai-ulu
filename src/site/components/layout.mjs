import { site, waLink } from "../config.mjs";
import { nav, footerLinks, socials } from "../content/site-content.mjs";
import { escapeHtml } from "../lib/html.mjs";

function head({ title, description, path, jsonLd, styles = [], noscript = "", canonical = true, noindex = false }) {
  const fullTitle = title ? `${title} · ${site.name}` : site.title;
  const url = `${site.url}${path}`;
  const ld = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : "";
  const css = styles.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n");
  // The 404 has no canonical: it is served for many unknown URLs, so naming one
  // would be a lie. Everything else points at its own absolute URL.
  const canonicalTag = canonical ? `<link rel="canonical" href="${url}">\n` : "";
  const robotsTag = noindex ? `<meta name="robots" content="noindex">\n` : "";
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
${canonicalTag}${robotsTag}<meta name="theme-color" content="#08090b">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.url}/og.png">
<meta property="og:image:alt" content="${escapeHtml(fullTitle)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="tr_TR">
<meta property="og:updated_time" content="${site.updated}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(fullTitle)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${site.url}/og.png">
<meta name="twitter:image:alt" content="${escapeHtml(fullTitle)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/fonts/bodoni-moda-normal-latin.woff2" as="font" type="font/woff2" crossorigin fetchpriority="high">
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/site.css">
<link rel="stylesheet" href="/print.css" media="print">
${css}
${ld}${noscript}`;
}

// Visible breadcrumb trail. Google shows it in the result and the BreadcrumbList
// JSON-LD (built in pages.mjs) mirrors the same order.
function breadcrumbNav(crumbs) {
  if (!crumbs?.length) return "";
  const items = crumbs
    .map((c, i) => {
      const last = i === crumbs.length - 1;
      const inner = last
        ? `<span aria-current="page">${escapeHtml(c.label)}</span>`
        : `<a href="${c.href}">${escapeHtml(c.label)}</a>`;
      return `<li>${inner}</li>`;
    })
    .join("");
  return `<nav class="crumbs" aria-label="Site yolu"><ol>${items}</ol></nav>`;
}

function header() {
  const links = nav
    .map((n) => `<a href="${n.href}"${n.keep ? ' class="keep"' : ""}>${escapeHtml(n.label)}</a>`)
    .join("\n      ");
  return `<header class="site-header">
  <div class="nav-glass">
    <a class="logo" href="/" aria-label="${site.name} ana sayfa">${site.name}</a>
    <nav aria-label="Ana menü">
      ${links}
    </nav>
    <a class="btn nav-cta" href="${waLink("Merhaba, web sitem için yazıyorum.")}" rel="noopener">WhatsApp</a>
  </div>
</header>`;
}

// The LinkedIn mark, rendered inside the 3D button (see .social-btn in site.css).
const socialIcons = {
  linkedin:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
};

function footer(note) {
  const links = footerLinks.map((l) => `<a href="${l.href}">${escapeHtml(l.label)}</a>`).join("");
  const social = socials.length
    ? `<nav class="footer-social" aria-label="Profiller">${socials
        .map((s) => `<a class="social-btn" href="${s.href}" rel="noopener" target="_blank" aria-label="${escapeHtml(s.label)}">${socialIcons[s.icon] ?? ""}</a>`)
        .join("")}</nav>`
    : "";
  return `<footer class="site-footer">
  <span>© ${new Date().getFullYear()} ${escapeHtml(site.owner)} · ${site.name}${note ? ` · ${escapeHtml(note)}` : ""}</span>
  <div class="footer-end">${social}<nav aria-label="Alt menü">${links}</nav></div>
</footer>`;
}

// before: markup placed ahead of the header (the home preloader); scripts: extra module scripts.
export function page({ title, description = site.description, path, body, jsonLd = null, before = "", scripts = [], styles = [], footerNote = "", crumbs = [], noscript = "", canonical = true, noindex = false }) {
  const extra = scripts.map((src) => `<script type="module" src="${src}"></script>`).join("\n");
  return `<!doctype html>
<html lang="${site.lang}">
<head>
${head({ title, description, path, jsonLd, styles, noscript, canonical, noindex })}
</head>
<body>
<a class="skip-link" href="#main">İçeriğe geç</a>
<canvas id="vortex" aria-hidden="true"></canvas>
<div class="vignette" aria-hidden="true"></div>
${before}
${header()}
<main id="main">
${breadcrumbNav(crumbs)}
${body}
</main>
<nav class="callbar" aria-label="Hızlı iletişim">
<a class="callbar-btn tel" href="tel:${site.phone}">Ara</a>
<a class="callbar-btn wa" href="${waLink("Merhaba, web sitem için yazıyorum.")}" rel="noopener">WhatsApp</a>
</nav>
${footer(footerNote)}
<script src="/app.js" defer></script>
<script type="module" src="/vortex.js"></script>
${extra}
</body>
</html>`;
}
