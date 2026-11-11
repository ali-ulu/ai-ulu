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
  // Restore the saved theme before first paint so the ground never flashes.
  const themeScript = `<script>try{var t=localStorage.getItem("aiulu-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}</script>`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
${canonicalTag}${robotsTag}<meta name="theme-color" content="#ebe9e5">
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
<link rel="preload" href="/fonts/geist-normal-latin.woff2" as="font" type="font/woff2" crossorigin fetchpriority="high">
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/site.css">
<link rel="stylesheet" href="/print.css" media="print">
${css}
${themeScript}
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

const THEME_TOGGLE = `<button class="theme-toggle" type="button" aria-label="Koyu temaya geç" aria-pressed="false">
      <svg class="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <svg class="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
    </button>`;

function header() {
  const links = nav
    .map((n) => `<a href="${n.href}"${n.keep ? ' class="keep"' : ""}>${escapeHtml(n.label)}</a>`)
    .join("\n      ");
  return `<header class="site-header">
  <a class="logo" href="/" aria-label="${site.name} ana sayfa">
      <span class="logo-mark" aria-hidden="true"></span>
      <span class="logo-word">${escapeHtml(site.name)}</span>
    </a>
  <div class="nav-end">
    <nav aria-label="Ana menü">
      ${links}
    </nav>
    ${THEME_TOGGLE}
  </div>
</header>`;
}

// The LinkedIn mark, rendered inside the 3D key button (see .social-btn in site.css).
const socialIcons = {
  linkedin:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
};

function footer(note) {
  const links = footerLinks.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join("");
  const social = socials.length
    ? `<nav class="footer-social" aria-label="Profiller">${socials
        .map((s) => `<a class="social-btn" href="${s.href}" rel="noopener" target="_blank" aria-label="${escapeHtml(s.label)}">${socialIcons[s.icon] ?? ""}</a>`)
        .join("")}</nav>`
    : "";
  return `<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-lead">
      <p class="footer-note">Bir fikriniz mi var? Konuşalım, ona çalışan bir biçim verelim.</p>
      <a class="btn" href="${waLink("Merhaba, web sitem için yazıyorum.")}" rel="noopener">Projeyi başlat <span aria-hidden="true">→</span></a>
    </div>
    <div>
      <p class="footer-h">Stüdyo</p>
      <nav aria-label="Alt menü"><ul>${links}</ul></nav>
    </div>
    <div>
      <p class="footer-h">İletişim</p>
      <ul>
        <li><a href="mailto:${site.email}">${site.email}</a></li>
        <li><a href="tel:${site.phone}">${site.phoneDisplay}</a></li>
      </ul>
      ${social}
    </div>
  </div>
  <p class="wordmark" aria-hidden="true">${site.name}</p>
  <div class="footer-base">
    <span>© ${new Date().getFullYear()} ${escapeHtml(site.owner)} · ${site.name}${note ? ` · ${escapeHtml(note)}` : ""}</span>
    <div class="footer-end"><a class="credit" href="/blog/">Blog</a></div>
  </div>
</footer>`;
}

// before: markup placed ahead of the header (unused now the preloader is gone);
// scripts: extra module scripts.
export function page({ title, description = site.description, path, body, jsonLd = null, before = "", scripts = [], styles = [], footerNote = "", crumbs = [], noscript = "", canonical = true, noindex = false }) {
  const extra = scripts.map((src) => `<script type="module" src="${src}"></script>`).join("\n");
  return `<!doctype html>
<html lang="${site.lang}" data-api="${site.base === "/" ? "on" : "off"}">
<head>
${head({ title, description, path, jsonLd, styles, noscript, canonical, noindex })}
</head>
<body>
<a class="skip-link" href="#main">İçeriğe geç</a>
${before}
${header()}
<main id="main">
${breadcrumbNav(crumbs)}
${body}
</main>
<nav class="dock" aria-label="Hızlı iletişim">
<a class="dock-btn wa" href="${waLink("Merhaba, web sitem için yazıyorum.")}" rel="noopener" aria-label="WhatsApp'tan yazın" title="WhatsApp">
<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><path fill="#fff" d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.42 1.28 4.86L2 22l5.32-1.4a9.9 9.9 0 0 0 4.72 1.2c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm0 18.1c-1.5 0-2.9-.4-4.14-1.12l-.3-.18-3.16.83.85-3.08-.2-.32a8.1 8.1 0 0 1-1.25-4.31c0-4.5 3.66-8.16 8.16-8.16s8.16 3.66 8.16 8.16-3.66 8.16-8.16 8.16zm4.5-6.1c-.25-.13-1.46-.72-1.68-.8-.23-.08-.4-.13-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.26-.02-.4.11-.52.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43l-.48-.01c-.16 0-.42.06-.65.31-.22.25-.85.83-.85 2.02s.87 2.35 1 2.51c.12.17 1.72 2.63 4.17 3.68.58.25 1.04.4 1.4.51.58.19 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.11-.23-.17-.48-.29z"/></svg>
</a>
<a class="dock-btn tel" href="tel:${site.phone}" aria-label="Telefonla arayın: ${site.phoneDisplay}" title="Telefon">
<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><g fill="#2a1e05" transform="rotate(-34 12 12)"><circle cx="5.1" cy="12" r="3.7"/><circle cx="18.9" cy="12" r="3.7"/><rect x="5.1" y="9.6" width="13.8" height="4.8" rx="2.4"/></g><g fill="none" stroke="#fff" stroke-linecap="round" stroke-opacity=".28" transform="rotate(-34 12 12)"><path d="M7.4 10.9h9.2" stroke-width="1.1"/></g></svg>
</a>
</nav>
${footer(footerNote)}
<script src="/app.js" defer></script>
${extra}
</body>
</html>`;
}
