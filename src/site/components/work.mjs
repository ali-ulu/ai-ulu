import { site, waLink } from "../config.mjs";
import { products, articles } from "../content/work.mjs";
import { escapeHtml } from "../lib/html.mjs";

// The kind of link decides the small label, so a visitor knows where a click
// leads before taking it.
const LINK_LABEL = { live: "Canlı", repo: "GitHub" };

function productCard(p) {
  const stack = p.stack.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const links = p.links
    .map(
      (l) =>
        `<a class="wk-link" href="${l.href}" rel="noopener" target="_blank">${escapeHtml(l.label)}<span class="wk-link-kind">${LINK_LABEL[l.kind] ?? ""}</span></a>`,
    )
    .join("");
  return `<li class="wk-item${p.featured ? " wk-item--featured" : ""}">
    <div class="wk-head">
      <h2>${escapeHtml(p.name)}</h2>
      <p class="wk-tag">${escapeHtml(p.tagline)}</p>
    </div>
    <p class="wk-summary">${escapeHtml(p.summary)}</p>
    <p class="wk-detail">${escapeHtml(p.detail)}</p>
    <ul class="wk-stack">${stack}</ul>
    <div class="wk-links">${links}</div>
  </li>`;
}

function articleRow(a) {
  return `<li class="wk-article">
    <a href="${a.href}" rel="noopener" target="_blank">
      <span class="wk-article-title">${escapeHtml(a.title)}</span>
      <span class="wk-article-meta"><span class="wk-platform">${escapeHtml(a.platform)}</span><time datetime="${a.date}">${a.date}</time></span>
    </a>
  </li>`;
}

export const workBody = () => `<section class="s wk">
  <div class="wk-wrap">
    <header class="wk-intro">
      <p class="eyebrow">Çalışmalar</p>
      <h1>Kendi yazdığım <em>yazılımlar</em></h1>
        <p class="lead">Hepsi yayında, kaynak kodu açık ve baştan sona kendi yazdığım ürünler. Sizin sitenizi de aynı özenle kurarım.</p>
      </header>

    <ul class="wk-list">
      ${products.map(productCard).join("\n      ")}
    </ul>

    <section class="wk-articles" aria-labelledby="wk-articles-title">
      <h2 id="wk-articles-title">Yayınlanmış <em>yazılarım</em></h2>
      <p class="lead">Yapay zekâ güvenliği ve ajan sistemleri üzerine, başka platformlarda yayınlanmış yazılar. Yazılar İngilizce; orijinalleri kendi adreslerinde kalır.</p>
      <ul class="wk-article-list">
        ${articles.map(articleRow).join("\n        ")}
      </ul>
    </section>

    <p class="wk-cta">
      <a class="btn" href="${waLink("Merhaba, web sitem için yazıyorum.")}" rel="noopener">Sizin için de konuşalım</a>
    </p>

    <nav class="bl-back" aria-label="Sayfalar">
      <a href="/">← Ana sayfa</a>
      <a href="/blog/">Blog</a>
      <a href="/#iletisim">İletişim</a>
    </nav>
  </div>
</section>`;

// JSON-LD: the products are the owner's own software, so they are listed as
// SoftwareApplication, each pointing at its source. Articles keep their original
// URL as the canonical target — we link to them, we do not host them.
export function workLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Çalışmalar · ${site.name}`,
      url: `${site.url}/calismalar/`,
      inLanguage: site.lang,
      isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      about: products.map((p) => ({
        "@type": "SoftwareApplication",
        name: p.name,
        description: p.summary,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Cross-platform",
        url: p.links.find((l) => l.kind === "live")?.href ?? p.links[0].href,
        author: { "@type": "Person", name: site.owner, url: site.url },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Yayınlanmış yazılar",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: a.href,
        name: a.title,
      })),
    },
  ];
}
