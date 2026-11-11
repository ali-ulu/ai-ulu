// Liquid Glass navbar: thicken the pill once the page is scrolled.
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 24);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });
})();

// Theme toggle: flip the ground between paper and ink and remember the choice.
// The inline script in <head> applies it before first paint.
(function () {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  const root = document.documentElement;
  const isDark = () => root.dataset.theme === "dark";
  function sync() {
    const dark = isDark();
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "Açık temaya geç" : "Koyu temaya geç");
  }
  sync();
  btn.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try {
      localStorage.setItem("aiulu-theme", root.dataset.theme);
    } catch {
      /* private mode: the toggle still works for this page */
    }
    sync();
  });
})();

// Page-view beacon: one anonymous request per page, no cookie and no stored
// identifier. The worker records day, path, referrer host and country. Skipped
// on a static host (no /api/hit there, so a request would only 404).
const HAS_API = document.documentElement.dataset.api !== "off";
(function () {
  if (!HAS_API) return;
  try {
    const body = JSON.stringify({ path: location.pathname });
    const send = () =>
      fetch("/api/hit", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
    if (document.readyState === "complete") send();
    else addEventListener("load", send, { once: true });
  } catch {
    /* never let analytics break the page */
  }
})();

// Error monitoring: report uncaught errors and unhandled rejections to the
// worker, which logs them (Cloudflare Workers Logs). One report per page load
// keeps a broken loop from hammering the endpoint, and the request is
// fire-and-forget so reporting can never break the page it is reporting on.
(function () {
  let sent = false;
  function report(detail) {
    if (sent || !HAS_API) return;
    sent = true;
    try {
      fetch("/api/error", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...detail, path: location.pathname }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* never let monitoring break the page */
    }
  }
  addEventListener("error", (e) => {
    if (e.target && e.target !== window) return; // ignore failed <img>/<script> loads
    report({ message: e.message, source: e.filename, line: e.lineno, col: e.colno, stack: e.error && e.error.stack });
  });
  addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    report({ message: (r && r.message) || String(r), stack: r && r.stack });
  });
})();

// Progressive enhancement: the form works without JS only as a normal POST
// fallback; here we submit via fetch for an inline status message, and the
// postcard behaves like one — a counter, a live sign-off, a fly-away.
(function () {
  const form = document.getElementById("lead-form");
  if (!form) return;
  const pm = form.closest(".pm");
  const status = document.getElementById("form-status");
  const submit = form.querySelector('button[type="submit"]');
  const msg = form.querySelector("#msg");
  const count = document.getElementById("pm-count");
  const sign = document.getElementById("pm-sign");
  const nameField = form.querySelector("#name");
  const thanks = document.getElementById("pm-thanks");

  // The counter fills as you write, and the hand gets smaller so the card
  // keeps fitting. The limit is the textarea's own maxlength.
  const max = msg ? Number(msg.getAttribute("maxlength")) || 280 : 280;
  function refreshWrite() {
    if (!msg) return;
    const len = msg.value.length;
    if (count) count.textContent = `${len} / ${max}`;
    msg.style.setProperty("--pm-size", `${(34 - Math.min(1, len / max) * 14).toFixed(1)}px`);
  }
  if (msg) {
    msg.addEventListener("input", refreshWrite);
    refreshWrite();
  }

  // The sender's name signs the card as they type it.
  function refreshSign() {
    if (!sign || !nameField) return;
    sign.textContent = nameField.value.trim() || "imzanız";
  }
  if (nameField) {
    nameField.addEventListener("input", refreshSign);
    refreshSign();
  }

  // Campaign attribution: carry utm_source/utm_campaign from the landing URL into
  // the hidden fields, so the worker can record where the lead came from.
  for (const key of ["utm_source", "utm_campaign"]) {
    const field = form.elements[key];
    if (field) field.value = new URLSearchParams(location.search).get(key) || "";
  }

  function setStatus(state, message) {
    status.dataset.state = state;
    status.textContent = message;
  }

  // The GitHub Pages build has no /api/lead, so a submit that cannot reach the
  // worker still reaches the owner: hand the message to WhatsApp, prefilled.
  function whatsappHref(data) {
    const lines = [
      "Merhaba, web sitem için yazıyorum.",
      data.msg ? `\n${data.msg}` : "",
      `\nAd: ${data.name}`,
      `İletişim: ${data.reach}`,
    ];
    const num = form.dataset.wa || "";
    return `https://wa.me/${num}?text=${encodeURIComponent(lines.join("\n"))}`;
  }
  function handOffToWhatsApp(data) {
    const url = whatsappHref(data);
    if (url) window.open(url, "_blank", "noopener");
  }
  // No worker (static host): skip the doomed request and go straight to WhatsApp.
  const hasApi = form.dataset.api !== "off";

  function sendAway() {
    if (!pm) {
      form.reset();
      refreshWrite();
      setStatus("ok", "Teşekkürler! Mesajınız alındı, en kısa sürede dönüş yapacağız.");
      return;
    }
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      form.hidden = true;
      if (thanks) thanks.hidden = false;
    };
    pm.classList.add("is-sent");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) land();
    else {
      form.addEventListener("animationend", land, { once: true });
      setTimeout(land, 1400); // fallback if the animation event is missed
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    submit.disabled = true;
    setStatus("", "");
    status.removeAttribute("data-state");

    // Static host: no API to post to, so open WhatsApp with the message filled in.
    if (!hasApi) {
      handOffToWhatsApp(data);
      submit.disabled = false;
      sendAway();
      return;
    }

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        sendAway();
      } else {
        setStatus("error", body.error || "Bir sorun oluştu. Lütfen tekrar deneyin veya e-posta gönderin.");
      }
    } catch {
      setStatus("error", "Bağlantı hatası. Lütfen tekrar deneyin veya e-posta gönderin.");
    } finally {
      submit.disabled = false;
    }
  });
})();
