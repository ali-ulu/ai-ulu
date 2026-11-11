import { page } from "./components/layout.mjs";
import { homeBody } from "./components/home.mjs";
import { blogIndexBody, byDateDesc, postBody } from "./components/blog.mjs";
import { workBody, workLd } from "./components/work.mjs";
import { site } from "./config.mjs";
import { faq } from "./content/site-content.mjs";

function organizationLd() {
  const { streetAddress, addressLocality, postalCode, addressCountry } = site.address;
  const hasAddress = Boolean(streetAddress || addressLocality || postalCode);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.name,
    url: site.url,
    email: site.email,
    telephone: site.phone,
    description: site.description,
    image: `${site.url}/og.png`,
    areaServed: "TR",
    knowsLanguage: ["tr"],
    serviceType: "Web sitesi tasarımı ve geliştirme",
    // Only emitted when the config actually carries the value, so no placeholder
    // address or price ever ships.
    ...(hasAddress ? { address: { "@type": "PostalAddress", streetAddress, addressLocality, postalCode, addressCountry } } : {}),
    ...(site.priceRange ? { priceRange: site.priceRange } : {}),
    // A starting price, when the owner sets one, becomes a real Offer.
    ...(site.priceFrom
      ? {
          offers: {
            "@type": "Offer",
            price: site.priceFrom,
            priceCurrency: "TRY",
            availability: "https://schema.org/InStock",
            url: `${site.url}/#paketler`,
          },
        }
      : {}),
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
    dateModified: site.updated,
  };
}

// Per-page freshness signals so crawlers and AI assistants can see when the
// page last changed.
function webPageLd(path, { title, description }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title ? `${title} · ${site.name}` : site.title,
    description,
    url: `${site.url}${path}`,
    inLanguage: site.lang,
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
    datePublished: site.updated,
    dateModified: site.updated,
  };
}

// The WebSite entity, emitted on the home page only, with the SearchAction that
// enables the Sitelinks Searchbox. Search is anchored on the FAQ/blog since the
// site itself has no search endpoint.
function webSiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: site.lang,
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${site.url}/blog/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

// BreadcrumbList mirrors the visible trail so Google can show the hierarchy.
function breadcrumbLd(crumbs) {
  if (!crumbs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${site.url}${c.href === "/" ? "/" : c.href}`,
    })),
  };
}

function faqLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

// A post is a BlogPosting; the author and publisher are the site owner. The
// target query rides along as keywords, which is what the post was written for.
function blogPostingLd(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: `${site.url}/blog/${post.slug}/`,
    mainEntityOfPage: `${site.url}/blog/${post.slug}/`,
    datePublished: post.published,
    dateModified: post.updated,
    inLanguage: site.lang,
    keywords: post.targetQuery,
    author: { "@type": "Person", name: site.owner, url: `${site.url}/`, ...(site.sameAs.length ? { sameAs: site.sameAs } : {}) },
    publisher: { "@type": "Organization", name: site.name, url: site.url, logo: { "@type": "ImageObject", url: `${site.url}/icon-512.png` } },
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
  };
}

function blogLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${site.name} Blog`,
    url: `${site.url}/blog/`,
    inLanguage: site.lang,
    blogPost: byDateDesc.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${site.url}/blog/${p.slug}/`,
      datePublished: p.published,
    })),
  };
}

const privacyBody = () => `<section class="s">
  <span class="eyebrow">Gizlilik</span>
  <h1>Gizlilik ve <em>KVKK</em></h1>
  <div class="prose">
    <p>Bu sayfa, ${site.name} üzerinden ilettiğiniz bilgilerin nasıl işlendiğini açıklar.</p>
    <h2>Hangi verileri topluyoruz?</h2>
    <p>Yalnızca iletişim formunda paylaştığınız ad, e-posta veya telefon ve proje açıklamasını toplarız. Kötüye kullanımı önlemek için gönderimin IP adresi ve tarayıcı bilgisi de kaydedilir.</p>
    <h2>Ne için kullanıyoruz?</h2>
    <p>Bu bilgiler yalnızca size dönüş yapmak ve teklif hazırlamak için kullanılır. Reklam amacıyla üçüncü taraflarla paylaşılmaz.</p>
    <h2>Nasıl saklanıyor?</h2>
    <p>Veriler şifreli bağlantı (HTTPS) üzerinden iletilir ve Cloudflare altyapısında, yalnızca yetkili kişinin erişebildiği bir veritabanında saklanır. Kayıtlar en fazla 12 ay tutulur; bu sürenin sonunda otomatik olarak silinir. IP adresi ve tarayıcı bilgisi yalnızca kötüye kullanımı önlemek için kısa süreliğine saklanır.</p>
    <h2>Çerezler ve ziyaret ölçümü</h2>
    <p>Bu site çerez kullanmaz, tarayıcınıza kimlik kaydetmez ve reklam ya da izleme aracı çalıştırmaz. Yalnızca kaç kişinin hangi sayfayı açtığını görmek için anonim bir sayaç tutarız: sayfa yolu, gün, sizi yönlendiren sitenin adı ve ülke. Bu kayıt tek başına sizi tanımlamaz.</p>
    <h2>Haklarınız</h2>
    <p>KVKK kapsamında verilerinize erişmeyi, düzeltilmesini veya silinmesini talep edebilirsiniz. Bunun için <a href="mailto:${site.email}">${site.email}</a> adresine yazabilirsiniz.</p>
  </div>
</section>`;

// Plain, honest terms: what we do, what we need from the client, who owns the
// result. Kept short on purpose — the specifics live in each written quote.
const termsBody = () => `<section class="s">
  <span class="eyebrow">Şartlar</span>
  <h1>Kullanım <em>şartları</em></h1>
  <div class="prose">
    <p>Bu sayfa, ${site.name} ile çalışırken geçerli olan genel koşulları açıklar. Her projenin kapsamı, takvimi ve ücreti ayrıca yazılı teklifte belirtilir; teklif ile bu sayfa arasında bir fark olursa teklif geçerlidir.</p>
    <h2>Hizmetin kapsamı</h2>
    <p>Web sitesi ve web uygulaması tasarımı, geliştirmesi ve yayına alma hizmeti veririz. Kapsam, ücretsiz görüşmeden sonra yazılı teklifte netleşir; teklifte yazmayan işler kapsam dışıdır.</p>
    <h2>Müşterinin sorumlulukları</h2>
    <p>İçerik (metin, logo, fotoğraf), alan adı ve barındırma hesabı gibi bilgileri zamanında sağlamak müşterinin sorumluluğundadır. Müşteri, sağladığı içeriğin haklarını elinde bulundurduğunu kabul eder.</p>
    <h2>Ödeme</h2>
    <p>Ödeme koşulları teklifte belirtilir. Proje, kararlaştırılan ödemeler yapılmadan yayına alınmaz.</p>
    <h2>Fikri mülkiyet</h2>
    <p>Ödeme tamamlandığında tasarım, kod ve içerik müşteriye aittir; dosyalar yayında teslim edilir. ${site.name}, çalışmayı referans olarak gösterme hakkını saklı tutar.</p>
    <h2>Revizyon ve teslim</h2>
    <p>Dahil edilen revizyon sayısı teklifte yazılıdır. Kapsam dışı ek talepler ayrıca fiyatlandırılır.</p>
    <h2>Sorumluluk sınırı</h2>
    <p>Arama motorlarında veya yapay zekâ yanıtlarında belirli bir sıralama ya da sonuç garanti edilmez. Site, üçüncü taraf platformların (arama motorları, barındırma, mesajlaşma) kesintilerinden sorumlu tutulamaz.</p>
    <h2>İletişim</h2>
    <p>Sorularınız için <a href="mailto:${site.email}">${site.email}</a> adresine yazabilirsiniz.</p>
  </div>
</section>`;

// 404: honest, with a way out. Served by Cloudflare Workers assets
// (wrangler.jsonc → not_found_handling: "404-page").
const notFoundBody = () => `<section class="s nf">
  <div class="nf-wrap">
    <p class="eyebrow">404</p>
    <h1>Aradığınız sayfayı <em>bulamadık.</em></h1>
    <p class="lead">Bağlantı eskimiş ya da adres yanlış yazılmış olabilir. Aşağıdan devam edebilirsiniz.</p>
    <nav class="nf-links" aria-label="Sayfalar">
      <a class="btn" href="/">Ana sayfa</a>
      <a class="btn ghost" href="/blog/">Blog</a>
      <a class="btn ghost" href="/calismalar/">Çalışmalar</a>
      <a class="btn ghost" href="/sablonlar/">Örnek tasarımlar</a>
    </nav>
  </div>
</section>`;

export const pages = [
  {
    path: "/",
    file: "index.html",
    jsonLd: [webSiteLd(), organizationLd(), faqLd()],
    scripts: ["/liquid.js"],
    styles: ["/faq-drawer.css", "/postmark-form.css", "/blog.css"],
    footerNote: "Ekrandaki klinik sitesi örnek tasarımdır",
    body: homeBody,
  },
  {
    path: "/blog/",
    file: "blog/index.html",
    title: "Blog",
    description: "Web sitesi fiyatı, arama görünürlüğü ve müşteri kazanma üzerine pratik yazılar.",
    jsonLd: [blogLd()],
    styles: ["/blog.css"],
    crumbs: [{ href: "/", label: "Ana sayfa" }, { href: "/blog/", label: "Blog" }],
    body: blogIndexBody,
  },
  ...byDateDesc.map((post) => ({
    path: `/blog/${post.slug}/`,
    file: `blog/${post.slug}/index.html`,
    // The <title> stays inside the SERP limit; the full headline is kept for the
    // on-page h1 and the BlogPosting schema.
    title: post.metaTitle || post.title,
    description: post.description,
    jsonLd: [blogPostingLd(post)],
    styles: ["/blog.css"],
    crumbs: [
      { href: "/", label: "Ana sayfa" },
      { href: "/blog/", label: "Blog" },
      { href: `/blog/${post.slug}/`, label: post.title },
    ],
    body: () => postBody(post.slug),
  })),
  {
    path: "/calismalar/",
    file: "calismalar/index.html",
    title: "Çalışmalar",
    description:
      "ai-ulu'nun kendi geliştirdiği yazılımlar: AI ajanları için doğrulama katmanı HUQAN, yerel hafıza aracı LEVH ve satış sistemi LeadScout.",
    jsonLd: workLd(),
    styles: ["/work.css"],
    crumbs: [{ href: "/", label: "Ana sayfa" }, { href: "/calismalar/", label: "Çalışmalar" }],
    body: workBody,
  },
  {
    path: "/gizlilik/",
    file: "gizlilik/index.html",
    title: "Gizlilik ve KVKK",
    description: "ai-ulu gizlilik politikası ve kişisel verilerin korunması (KVKK) bilgilendirmesi.",
    crumbs: [{ href: "/", label: "Ana sayfa" }, { href: "/gizlilik/", label: "Gizlilik ve KVKK" }],
    body: privacyBody,
  },
  {
    path: "/kullanim-sartlari/",
    file: "kullanim-sartlari/index.html",
    title: "Kullanım şartları",
    description: "ai-ulu ile çalışırken geçerli genel koşullar: hizmet kapsamı, ödeme, fikri mülkiyet ve sorumluluk.",
    crumbs: [{ href: "/", label: "Ana sayfa" }, { href: "/kullanim-sartlari/", label: "Kullanım şartları" }],
    body: termsBody,
  },
];

// The 404 is written to /404.html and served by the assets binding for any
// unknown path. It is deliberately not in the sitemap.
export const notFoundPage = {
  path: "/404.html",
  file: "404.html",
  title: "Sayfa bulunamadı",
  description: "Aradığınız sayfa bulunamadı. Ana sayfaya, bloga ya da çalışmalara dönebilirsiniz.",
  canonical: false,
  noindex: true,
  body: notFoundBody,
};

export function renderPage(p) {
  const bc = breadcrumbLd(p.crumbs);
  const jsonLd = [webPageLd(p.path, p), ...(bc ? [bc] : []), ...(p.jsonLd || [])];
  return page({ ...p, jsonLd, body: p.body() });
}
