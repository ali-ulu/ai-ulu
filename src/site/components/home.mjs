import { site, waLink } from "../config.mjs";
import { budgets, faq, projectTypes } from "../content/site-content.mjs";
import { blogTeaser } from "./blog.mjs";
import { escapeHtml } from "../lib/html.mjs";

const wa = `<a class="btn" href="${waLink("Merhaba, web sitem için ücretsiz görüşme istiyorum.")}" rel="noopener">`;

// Cloudflare Turnstile, rendered only when a site key is configured. Empty key
// means no third-party script, no iframe, and the CSP stays 'self'-only.
function turnstileWidget() {
  if (!site.turnstileSiteKey) return "";
  return `<div class="cf-turnstile" data-sitekey="${escapeHtml(site.turnstileSiteKey)}" data-theme="light"></div>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`;
}

export const preloader = `<div id="pre" role="status" aria-live="polite" aria-label="Yükleniyor"><div class="in">
  <div class="mark" aria-hidden="true">ai-ulu</div>
  <div class="bar"><i id="preBar"></i></div>
  <div class="pct" id="prePct" aria-hidden="true">000</div>
</div></div>`;

// Without JS the 3D film never runs, so every chapter stays at opacity:0 and the
// page reads as empty. These rules (a static copy of the `.no-3d` fallback)
// flatten the chapters into a plain, scrollable column.
export const noJsStyles = `<noscript><style>
#pre,#vortex,.vignette,#gl,.tag,.prog,.hint,.callbar{display:none}
#film{height:auto}
.stage{position:static;height:auto;padding:8rem 0 4rem;background:none}
.ch,#c0{position:static;transform:none;opacity:1;visibility:visible;pointer-events:auto;margin:0 auto 5rem;padding:0 var(--pad);text-align:left;max-width:44rem;width:auto}
.ch.right{left:auto;right:auto;text-align:left}
.ch.right p,.ch.right .cta{margin-left:0;justify-content:flex-start}
</style></noscript>`;

// data-a / data-b: scroll progress (0–1) where each chapter fades in and out (read by ora.js).
const film = `<div id="film">
  <div class="stage">
    <canvas id="gl" aria-hidden="true"></canvas>

    <div class="ch" id="c0" data-a="0" data-b=".085">
      <span class="eyebrow">Web sitesi · Tasarım · Görünürlük</span>
      <h1>Müşteri getiren bir web sitesi <em>ister misiniz?</em></h1>
      <p>Harika tasarım, Google'da ve yapay zekâ aramalarında görünen, ziyaretçiyi müşteriye çeviren siteler kuruyoruz.</p>
      <div class="cta">
        ${wa}Ücretsiz görüşme <span aria-hidden="true">→</span></a>
        <a class="btn ghost" href="tel:${site.phone}">${site.phoneDisplay}</a>
      </div>
    </div>

    <div class="ch" id="c1" data-a=".14" data-b=".36">
      <span class="eyebrow">01 — Kod</span>
      <h2>Her satır <em>sizin için</em> yazılır.</h2>
      <p>Hazır şablon yok. Siteniz sıfırdan, işletmenizin hedefine göre kodlanır: hızlı, temiz ve size ait.</p>
    </div>

    <div class="ch right" id="c2" data-a=".42" data-b=".58">
      <span class="eyebrow">02 — Tasarım</span>
      <h2>Kod, <em>vitrininize</em> dönüşür.</h2>
      <p>Sektörünüze özel, ilk saniyede güven veren bir tasarım. Rakiplerinizden ayrışırsınız.</p>
    </div>

    <div class="ch" id="c3" data-a=".64" data-b=".8">
      <span class="eyebrow">03 — İçinde ne var</span>
      <h2>Güzel görünmesi <em>yetmez.</em></h2>
      <p>Her katman tek bir iş için çalışır: sizi bulduran, ikna eden ve aratan bir site.</p>
    </div>

    <div class="ch right" id="c4" data-a=".88" data-b="1.01">
      <span class="eyebrow">04 — Yayında</span>
      <h2>Müşteriniz sizi <em>bulsun.</em></h2>
      <p>Telefonda kusursuz, saniyeler içinde açılan, tek dokunuşla WhatsApp'tan size ulaştıran siteniz hazır.</p>
      <div class="cta"><a class="btn" href="#iletisim">Projeyi başlatalım <span aria-hidden="true">→</span></a></div>
    </div>

    <div class="tag" aria-hidden="true"><b>Tasarım</b>Markanıza özel arayüz</div>
    <div class="tag" aria-hidden="true"><b>Hız</b>Saniyeler içinde açılış</div>
    <div class="tag" aria-hidden="true"><b>Görünürlük</b>Google + yapay zekâ aramaları</div>
    <div class="tag" aria-hidden="true"><b>Dönüşüm</b>Tek dokunuşla WhatsApp</div>

    <div class="prog" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="hint" id="hint" aria-hidden="true">Kaydırın</div>
  </div>
</div>`;

const benefits = `<section class="s" id="nasil">
  <span class="eyebrow">Ne kazanırsınız</span>
  <h2>Ziyaretçi gelir, <em>müşteri</em> olarak kalır.</h2>
  <p class="lead">Çoğu site ilk kaydırmada ziyaretçiyi kaybeder. Sorun marka değil, kurulum. Biz kurulumu baştan doğru yaparız.</p>
  <p class="lead">Nereden başlayacağınızdan emin değilseniz <a href="/sablonlar/">örnek tasarımlara</a> göz atın, kapsamı <a href="/#paketler">paketlerde</a> karşılaştırın, çalışma şeklimizi <a href="/#nasil">süreçte</a> görün. "Yapay zekâ ile bedava yaparım" diyenler için dürüst cevabımız <a href="/#neden">aşağıda</a>.</p>
  <div class="grid g4">
    <div class="cell"><span class="n">01</span><h3>Özgün tasarım</h3><p>Şablon değil; sektörünüze ve markanıza göre çizilmiş bir site.</p></div>
    <div class="cell"><span class="n">02</span><h3>Google'da görünürlük</h3><p>Teknik SEO, hız ve yapılandırılmış veri ilk günden sitenin içinde.</p></div>
    <div class="cell"><span class="n">03</span><h3>Yapay zekâ aramaları</h3><p>ChatGPT, Gemini ve Google'ın yapay zekâ yanıtlarının okuyabildiği yapı: llms.txt, şema, temiz HTML.</p></div>
    <div class="cell"><span class="n">04</span><h3>Doğrudan iletişim</h3><p>Her sayfada tek dokunuşla WhatsApp ve arama. Ziyaretçi aklındayken size ulaşır.</p></div>
  </div>
</section>`;

// The largest objection people type into search is "can I just build it with AI
// for free?". Answering it head-on beats ignoring it, so the site says where a
// generated draft stops and a business site starts. No invented numbers.
const why = `<section class="s" id="neden">
  <span class="eyebrow">Dürüst cevap</span>
  <h2>"Yapay zekâ ile <em>bedava</em> yaparım" — peki neden bize?</h2>
  <p class="lead">Araçlar artık ilk taslağı saniyeler içinde üretiyor; bunu saklamayacağız. Fark, taslağın bittiği yerde başlıyor.</p>
  <div class="grid g3">
    <div class="cell"><span class="n">01</span><h3>Doğru metin, doğru müşteri</h3><p>Yapay zekâ elindeki bilgiyi dizer; sizin işletmenizi, müşterinizi ve teklifinizi bilmez. Sizi arayan kişinin duymak istediği cümleyi biz yazarız.</p></div>
    <div class="cell"><span class="n">02</span><h3>Sahibi olduğunuz bir site</h3><p>Ücretsiz araçların ücretsiz planında alan adı onların, tasarım şablonun. Burada alan adı, kod ve içerik sizin adınıza teslim edilir.</p></div>
    <div class="cell"><span class="n">03</span><h3>Yayından sonra da çalışır</h3><p>Araç siteyi kurar ve bırakır. Biz hızı, arama görünürlüğünü ve dönüşümü ölçer, gerektiğinde düzeltiriz.</p></div>
  </div>
  <p class="lead">Hangi iş için hangisinin yettiğini <a href="/blog/yapay-zeka-ile-web-sitesi-yapmak/">yazıda</a> ayrıntılı anlattık.</p>
</section>`;

const process = `<section class="s">
  <span class="eyebrow">Süreç</span>
  <h2>Üç adımda <em>yayında.</em></h2>
  <div class="grid g3">
    <div class="cell"><span class="n">01 · Görüşme</span><h3>Hedefi konuşuruz</h3><p>Ücretsiz 30 dakikalık görüşme. Hedef, kapsam ve takvim netleşir.</p></div>
    <div class="cell"><span class="n">02 · Kurulum</span><h3>Canlı izlersiniz</h3><p>Tasarım ve geliştirme açıkta ilerler; ilk haftadan tıklanabilir önizleme.</p></div>
    <div class="cell"><span class="n">03 · Yayın</span><h3>Yanınızda kalırız</h3><p>Gerçek cihazlarda test eder, yayına alır, sonrasında da düzeltme ve değişiklikleri yaparız.</p></div>
  </div>
</section>`;

const packages = `<section class="s" id="paketler">
  <span class="eyebrow">Paketler</span>
  <h2>Paketi seçin, <em>net teklif</em> alın.</h2>
  <p class="lead">${site.priceFrom ? `Tanıtım siteleri ${escapeHtml(site.priceFrom)} başlar; kalan kapsam projeye göre netleşir.` : "Fiyat listesi yok; her proje kendi kapsamıyla fiyatlanır."} Görüşmeden sonra 24 saat içinde yazılı teklif gelir. 2026 pazar aralıklarını <a href="/blog/web-sitesi-fiyatlari-2026/">fiyat yazısında</a>, fiyatı neyin belirlediğini <a href="/blog/web-sitesi-fiyatini-ne-belirler/">rehberde</a> anlattık; tarzlar için <a href="/sablonlar/">örnek tasarımlara</a> bakabilirsiniz.</p>
  <div class="grid g3">
    <div class="cell"><span class="n">Web sitesi</span><h3>Tanıtım sitesi</h3><ul><li>Markanıza özel tasarım</li><li>Hızlı açılış, akıcı hareket</li><li>Google ve YZ aramalarına hazır</li><li>Yayın ve sonrası destek</li></ul><a class="btn ghost" href="#iletisim">Teklif al</a></div>
    <div class="cell"><span class="n">Uygulama</span><h3>Özel web uygulaması</h3><ul><li>Panel, portal, otomasyon</li><li>İş akışınıza göre kurulur</li><li>Randevu, sipariş, form</li><li>Yayın ve sonrası destek</li></ul><a class="btn ghost" href="#iletisim">Teklif al</a></div>
    <div class="cell hi"><span class="n">En kapsamlı</span><h3>Site + uygulama</h3><ul><li>İkisinde tek tasarım dili</li><li>Tanıtım ve ürün bir arada</li><li>Tek ekip, tek muhatap</li><li>Yayın ve sonrası destek</li></ul><a class="btn" href="#iletisim">Teklif al</a></div>
  </div>
</section>`;

// FAQ Index drawer (adapted from the Framer "FaqDrawer" block). Each question
// is an index card standing in a recessed drawer, typed along its top edge on
// a staggered tab. Native <details>/<summary> carries the disclosure and the
// shared `name` keeps one card open at a time, so this needs no JavaScript.
const FAQ_TAB_STATIONS = [0.04, 0.37, 0.7];
const faqCard = (f, i, n, uid) => {
  // How far into the drawer the card stands: 0 at the front, 1 at the back.
  const depth = n <= 1 ? 0 : (n - 1 - i) / (n - 1);
  const no = `S.${String(i + 1).padStart(2, "0")}`;
  return `<details class="fq-card" name="${uid}"${i === 0 ? " open" : ""} style="--k:${i};--depth:${depth.toFixed(3)};--tab-at:${FAQ_TAB_STATIONS[i % FAQ_TAB_STATIONS.length]}">
      <summary class="fq-edge">
        <span class="fq-tab" aria-hidden="true">${escapeHtml(f.tab)}</span>
        <span class="fq-no" aria-hidden="true">${no}</span>
        <span class="fq-q">${escapeHtml(f.q)}</span>
        <span class="fq-mark" aria-hidden="true"></span>
      </summary>
      <div class="fq-face"><p class="fq-a">${escapeHtml(f.a)}</p><p class="fq-filed" aria-hidden="true">${escapeHtml(f.tab)} · ${no}</p></div>
    </details>`;
};

const faqSection = () => {
  const items = faq.items;
  const uid = "faq-drawer";
  return `<section class="s" id="sss" aria-labelledby="sss-title">
  <div class="fq">
    <div class="fq-wrap">
      <header class="fq-head">
        <p class="fq-label">SSS</p>
        <h2 class="fq-title" id="sss-title">Merak <em>edilenler</em></h2>
        <p class="fq-lead">Sitenizi kurmadan önce en çok sorulanlar, bulabileceğiniz yerde. Okumak için bir kart çekin.</p>
      </header>
      <div class="fq-cabinet">
        <div class="fq-drawer">
          <div class="fq-tray">
            ${items.map((f, i) => faqCard(f, i, items.length, uid)).join("\n            ")}
          </div>
          <div class="fq-front" aria-hidden="true">
            <span class="fq-holder"><span class="fq-holder-card">ai-ulu · SSS</span></span>
            <span class="fq-pull"></span>
          </div>
        </div>
        <div class="fq-ask">
          <p class="fq-note">Aradığınızı bulamadınız mı? Bir kişi yanıtlar, genellikle aynı gün.</p>
          <a class="fq-key" href="mailto:${site.email}">Bize sorun</a>
        </div>
      </div>
    </div>
  </div>
</section>`;
};

// Postcard contact form (adapted from the Framer "Postmark" block). The field
// names, the ids (lead-form, form-status) and the JSON shape are the /api/lead
// contract in src/worker.js — do not rename them. Stamps are the form's topics
// and map onto the existing `type` field, so the endpoint is unchanged.
const stampMarkup = (o, i) => `<label>
        <input type="radio" name="type" value="${o.value}"${i === 0 ? " checked" : ""}>
        <span class="pm-stamp" style="--pm-tilt-stamp:${["-2deg", "1.5deg", "-1deg", "2.5deg"][i % 4]}">
          <i class="pm-glyph" aria-hidden="true">${escapeHtml(o.glyph)}</i>
          <span>${escapeHtml(o.label)}</span>
        </span>
      </label>`;

const postmarkSeal = `<svg class="pm-seal" viewBox="0 0 100 100" aria-hidden="true">
      <defs><path id="pm-seal-arc" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="0.8"/>
      <text><textPath href="#pm-seal-arc" startOffset="0%">AI-ULU · POSTA DAMGASI · WEB SITESI ·</textPath></text>
      <text class="pm-seal-c" x="50" y="50" text-anchor="middle" dominant-baseline="central">✳</text>
    </svg>`;

const contact = () => `<section class="s" id="iletisim">
  <span class="eyebrow">İletişim</span>
  <h2>Siteniz için <em>ilk adım.</em></h2>
  <p class="lead">Ne kurmak istediğinizi birkaç cümleyle yazın; 24 saat içinde ücretsiz görüşme için dönelim.</p>
  <div class="pm">
    <form class="pm-card" id="lead-form" novalidate>
      ${postmarkSeal}
      <div class="pm-body">
        <div class="pm-left">
          <p class="pm-greet" aria-hidden="true">Sevgili ai-ulu,</p>
          <div class="pm-write">
            <label class="visually-hidden" for="msg">Kısaca projeniz</label>
            <textarea id="msg" name="msg" maxlength="280" placeholder="Sektörünüz, istediğiniz sayfalar, beğendiğiniz bir site…"></textarea>
            <span class="pm-count" id="pm-count" aria-hidden="true">0 / 280</span>
          </div>
          <p class="pm-sign" aria-hidden="true">— <b id="pm-sign">imzanız</b>, gönderen</p>
        </div>
        <div class="pm-right">
          <fieldset class="pm-stamps">
            <legend>Konu · bir pul seçin</legend>
            ${projectTypes.map(stampMarkup).join("\n            ")}
          </fieldset>
          <div class="pm-block">
            <p class="pm-label">Kime</p>
            <p class="pm-addr"><strong>ai-ulu</strong>Stüdyo · web siteleri ve uygulamalar</p>
          </div>
          <div class="pm-block">
            <p class="pm-label">Kimden</p>
            <div class="pm-fields">
              <label class="visually-hidden" for="name">Ad Soyad / Firma</label>
              <input id="name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="120" placeholder="Ad Soyad / Firma">
              <label class="visually-hidden" for="reach">E-posta veya telefon</label>
              <input id="reach" name="reach" type="text" autocomplete="email" required maxlength="160" placeholder="E-posta veya telefon">
            </div>
          </div>
          <div class="pm-block">
            <p class="pm-label">Bütçe</p>
            <div class="pm-fields">
              <label class="visually-hidden" for="budget">Bütçe aralığı</label>
              <select id="budget" name="budget">
                ${budgets.map((b) => `<option value="${b.value}">${escapeHtml(b.label)}</option>`).join("\n                ")}
              </select>
            </div>
          </div>
          <div class="field--hp" aria-hidden="true">
            <label for="company">Şirket</label>
            <input id="company" name="company" type="text" tabindex="-1" autocomplete="off">
          </div>
          <input type="hidden" id="utm_source" name="utm_source" value="">
          <input type="hidden" id="utm_campaign" name="utm_campaign" value="">
        </div>
      </div>
      <div class="pm-foot">
        ${turnstileWidget()}<button class="pm-btn" type="submit">Postayı at <span aria-hidden="true">↗</span></button>
        <p class="form__note">Bilgileriniz yalnızca size dönüş yapmak için kullanılır. Ayrıntılar: <a href="/gizlilik/">Gizlilik ve KVKK</a>.</p>
        <p class="form__status" id="form-status" role="status" aria-live="polite"></p>
      </div>
    </form>
    <div class="pm-thanks" id="pm-thanks" hidden>
      <b>Posta yola çıktı ✈</b>
      <p>Teşekkürler! Mesajınız alındı, 24 saat içinde dönüş yapacağız.</p>
    </div>
  </div>
  <aside class="pm-aside">
    <span>Form doldurmak istemezseniz:</span>
    <a class="btn" href="${waLink("Merhaba, web sitem için yazıyorum.")}" rel="noopener">WhatsApp'tan yazın <span aria-hidden="true">→</span></a>
    <a class="btn ghost" href="tel:${site.phone}">${site.phoneDisplay}</a>
    <a href="mailto:${site.email}">${site.email}</a>
  </aside>
</section>`;

export const homeBody = () => [film, benefits, why, process, packages, faqSection(), blogTeaser(), contact()].join("\n\n");
