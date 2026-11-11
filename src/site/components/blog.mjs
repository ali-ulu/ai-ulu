import { site, waLink } from "../config.mjs";
import { posts } from "../content/blog.mjs";
import { escapeHtml } from "../lib/html.mjs";

// Newest first; posts sharing a date keep their order in the file (stable sort).
export const byDateDesc = [...posts].sort((a, b) =>
  a.published < b.published ? 1 : a.published > b.published ? -1 : 0,
);
export const findPost = (slug) => posts.find((p) => p.slug === slug);

// Inline formatting: escape first, then add back only the two spans we allow.
// Everything a post carries is plain text, so this is the whole HTML surface.
function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function block(b) {
  if (b.h) return `<h2>${inline(b.h)}</h2>`;
  if (b.ul) return `<ul>${b.ul.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`;
  if (b.note) return `<p class="bl-note">${inline(b.note)}</p>`;
  return `<p>${inline(b.p)}</p>`;
}

// "2026-11-11" → "11 Kasım 2026" (Turkish month names, no Intl dependency).
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function trDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return m >= 1 && m <= 12 ? `${d} ${MONTHS[m - 1]} ${y}` : iso;
}

export function postBody(slug) {
  const post = findPost(slug);
  const cta = post.cta;
  const updated = post.updated && post.updated !== post.published
    ? ` · <span class="bl-updated">Güncellendi: <time datetime="${post.updated}">${trDate(post.updated)}</time></span>`
    : "";
  return `<section class="s bl">
    <div class="bl-wrap">
      <header class="bl-head">
        <p class="eyebrow">Blog</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="lead">${escapeHtml(post.description)}</p>
        <p class="bl-meta"><span class="bl-author">${escapeHtml(site.owner)}</span> · <time datetime="${post.published}">${trDate(post.published)}</time>${updated}</p>
      </header>
      <article class="prose bl-post">
        ${post.body.map(block).join("\n        ")}
        <p class="bl-cta"><a class="btn" href="${waLink(cta.message)}" rel="noopener">${escapeHtml(cta.text)}</a></p>
      </article>
      <nav class="bl-back" aria-label="Blog">
        <a href="/blog/">← Tüm yazılar</a>
        <a href="/#iletisim">İletişim</a>
      </nav>
    </div>
  </section>`;
}

export const blogIndexBody = () => `<section class="s bl">
  <div class="bl-wrap">
    <header class="bl-head">
      <p class="eyebrow">Blog</p>
      <h1>Web sitesi, arama ve <em>müşteri</em> üzerine notlar</h1>
      <p class="lead">Teklif almadan önce bilmeniz gerekenler: fiyatı ne belirler, site ne zaman gerekir, aramada nasıl görünürsünüz. Uydurma istatistik yok; her yazı kendi başına okunur.</p>
    </header>
    <ul class="bl-list">
      ${byDateDesc.map((p) => `<li>
        <a class="bl-card" href="/blog/${p.slug}/">
          <span class="bl-card-eyebrow">${escapeHtml(p.targetQuery.split(",")[0].trim())}</span>
          <h2>${escapeHtml(p.title)}</h2>
          <p>${escapeHtml(p.description)}</p>
          <time datetime="${p.published}">${trDate(p.published)}</time>
        </a>
      </li>`).join("\n      ")}
    </ul>
    <nav class="bl-back" aria-label="Blog">
      <a href="/">← Ana sayfa</a>
      <a href="/#iletisim">İletişim</a>
    </nav>
  </div>
</section>`;

// A short, honest teaser that links to the posts from the home page.
export const blogTeaser = () => `<section class="s" id="blog" aria-labelledby="blog-title">
  <div class="bl-wrap">
    <header class="bl-head">
      <p class="eyebrow">Blog</p>
      <h2 class="bl-teaser-title" id="blog-title">Karar vermeden önce <em>okuyun</em></h2>
      <p class="lead">Site yaptırmadan önce en çok sorulan sorular, uzun uzun yazıldı. Kendi işinize uygulayın.</p>
    </header>
    <ul class="bl-list bl-list--teaser">
      ${byDateDesc.slice(0, 3).map((p) => `<li>
        <a class="bl-card" href="/blog/${p.slug}/">
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>
        </a>
      </li>`).join("\n      ")}
    </ul>
    <p class="bl-more"><a href="/blog/">Tüm yazılar <span aria-hidden="true">→</span></a></p>
  </div>
</section>`;
