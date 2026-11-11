// Products the owner built and writes published on other platforms.
//
// Why this lives on the site at all: the agency is new, so there are no client
// references yet. Shipping software of this size is the strongest honest answer
// to "can you actually build it" — and it is the experience signal that E-E-A-T
// asks for. Everything here links out; nothing is copied in.
//
// Rules for editing:
// - Only products the owner actually built and still stands behind.
// - `href` must resolve. `repo` is the public source when there is one.
// - Articles stay on their platform. Republishing them here would compete with
//   the original and split its ranking; we link instead.

export const products = [
  {
    slug: "huqan",
    name: "HUQAN",
    tagline: "AI ajanlarının riskli komutunu çalışmadan önce durdurur",
    summary:
      "Bir ajanın force-push, terraform apply ya da kubectl delete gibi geri dönüşü zor komutları çalıştırmasını engeller; git status gibi zararsız olanları geçirir. Her karar, kararı veren kapı tarafından üretilen ve yerelde doğrulanabilen bir Trust Receipt olarak kaydedilir.",
    detail:
      "Tamamen kendi makinenizde çalışır: model yok, bulut yok, API anahtarı yok. Onay yetkisi bir işletim sistemi servisinde tutulduğu için ajan kendi işlemini kendisi onaylayamaz.",
    stack: ["Node.js", "MCP", "Apache-2.0"],
    links: [
      { label: "huqan.com", href: "https://huqan.com", kind: "live" },
      { label: "Kaynak kod", href: "https://github.com/ali-ulu/huqan", kind: "repo" },
    ],
    featured: true,
  },
  {
    slug: "levh",
    name: "LEVH",
    tagline: "Yapay zekâ araçları için kalıcı, yerelde çalışan hafıza",
    summary:
      "Claude, Cursor, VS Code gibi araçlar her oturumda sıfırdan başlar. LEVH bunlara makinenizde duran, aranabilir bir hafıza verir; kararlarınızı ve projelerinizi oturumlar arasında hatırlar.",
    detail:
      "Çoğu hafıza aracı her şeyi saklar ve her şeyi geri getirir. LEVH bilerek unutur: her kaydın kendi eskime eğrisi vardır, kullanılmayanlar solar, güvendikleriniz kendiliğinden güçlenir. Her şey yerelde SQLite üzerinde çalışır; hesap, bulut, harici servis yok.",
    stack: ["Python", "MCP", "SQLite", "AGPL-3.0"],
    links: [
      { label: "levh sitesi", href: "https://ali-ulu.github.io/levh/", kind: "live" },
      { label: "Kaynak kod", href: "https://github.com/ali-ulu/levh", kind: "repo" },
    ],
    featured: false,
  },
  {
    slug: "leadscout",
    name: "LeadScout",
    tagline: "Yerel işletmeleri bulup web varlığını denetleyen satış sistemi",
    summary:
      "OpenStreetMap ve Overture verisinden yerel işletmeleri bulur, web siteleri olup olmadığını çapraz kontrol eder, iletişim bilgilerini toplar ve site denetimi yapar. Sonuç: hangi işletmenin gerçekten ihtiyacı olduğunu gösteren sıralı bir satış listesi.",
    detail:
      "Lighthouse ile performans ve erişilebilirlik ölçer; SEO, AEO ve yapay zekâ görünürlüğü için gerekçesi görülebilir 0–100 hazırlık puanı üretir. Baştan sona yerelde çalışır, veriyi buluta taşımaz.",
    stack: ["Python", "MCP", "Lighthouse"],
    links: [{ label: "Kaynak kod", href: "https://github.com/ali-ulu/lead", kind: "repo" }],
    featured: false,
  },
];

// Articles published elsewhere. `platform` is the site the piece lives on.
export const articles = [
  {
    title: "HUQAN: The Deterministic Trust Layer That Tells AI Agents \"Wait, I Decide First\"",
    platform: "dev.to",
    href: "https://dev.to/aliulu/huqan-the-deterministic-trust-layer-that-tells-ai-agents-wait-i-decide-first-5h31",
    date: "2026-07-31",
  },
  {
    title: "Turning a Tiny Language Model Into a Trustworthy Agent: An R&D Experiment with HUQAN + OPT-125M",
    platform: "dev.to",
    href: "https://dev.to/aliulu/turning-a-tiny-language-model-into-a-trustworthy-agent-an-rd-experiment-with-huqan-opt-125m-5399",
    date: "2026-07-31",
  },
  {
    title: "Let's Support Each Other's Projects — Why Shouldn't DEV Be Our Product Hunt?",
    platform: "dev.to",
    href: "https://dev.to/aliulu/lets-support-each-others-projects-why-shouldnt-dev-be-our-product-hunt-2ja",
    date: "2026-08-02",
  },
  {
    title: "Is \"Please double-check before use\" an honest safety boundary?",
    platform: "dev.to",
    href: "https://dev.to/aliulu/is-please-double-check-before-use-an-honest-safety-boundary-4k50",
    date: "2026-08-27",
  },
  {
    title: "Invisible Risk: Why Security Is Always Bought After the Incident",
    platform: "dev.to",
    href: "https://dev.to/aliulu/invisible-risk-why-security-is-always-bought-after-the-incident-249g",
    date: "2026-09-30",
  },
];
