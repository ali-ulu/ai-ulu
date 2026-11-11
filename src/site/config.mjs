import { normalizeBase } from "./lib/base.mjs";

// Where the built site is served. The root deployment (Cloudflare) keeps "/";
// GitHub Pages serves a project site under /ai-ulu/ and sets BASE_PATH.
export const base = normalizeBase(process.env.BASE_PATH);

// Public origin. The canonical/og/sitemap URLs follow the deployment so the
// GitHub Pages copy points at itself, never at the expired domain.
export const site = {
  name: "ai-ulu",
  owner: "Ali Ulu",
  url: process.env.SITE_URL || "https://ai-ulu.com",
  base,
  email: "aliulu@ai-ulu.com",
  lang: "tr",
  title: "ai-ulu — Müşteri getiren web siteleri",
  description:
    "ai-ulu, işletmeler için müşteri getiren web siteleri kurar: özgün tasarım, Google'da ve yapay zekâ aramalarında görünürlük, WhatsApp'a bağlı iletişim.",
  phone: "+905079581642",
  // Non-breaking spaces keep the number on one line; a telephone should never wrap.
  phoneDisplay: "+90\u00a0507\u00a0958\u00a016\u00a042",
  whatsapp: "https://wa.me/905079581642",
  // Local SEO signals. Left empty on purpose: fill them and they appear in the
  // ProfessionalService JSON-LD (see pages.mjs). Empty values are omitted, so no
  // placeholder data ever goes live.
  address: { streetAddress: "", addressLocality: "", postalCode: "", addressCountry: "TR" },
  priceRange: "", // e.g. "₺₺" or "25.000 ₺'den başlar"
  // Shown on the packages section when set ("Tanıtım siteleri X'den başlar").
  // Left empty on purpose: a real number beats a placeholder, so nothing ships
  // until the owner fills it in.
  priceFrom: "",
  sameAs: ["https://www.linkedin.com/in/aliulu777/"], // Google Business Profile, Instagram, LinkedIn
  // Cloudflare Turnstile site key. Empty = the widget is not rendered and the CSP
  // stays 'self'-only. Set it (and the worker's TURNSTILE_SECRET) to switch on
  // the CAPTCHA on the lead form.
  turnstileSiteKey: "",
  // Bump when the site content changes; feeds dateModified in JSON-LD, the
  // og:updated_time meta tag and sitemap lastmod.
  updated: "2026-11-11",
  // IndexNow key: the build writes /<key>.txt so Bing and Yandex accept our
  // submissions. Rotate by replacing this value.
  indexNowKey: "bec0a65e610429c17aa2c0cce8902c60",
};

// wa.me with a prefilled message. Every WhatsApp link on the site goes through
// this, so the number and the opening line live in one place.
export function waLink(text) {
  return text ? `${site.whatsapp}?text=${encodeURIComponent(text)}` : site.whatsapp;
}
