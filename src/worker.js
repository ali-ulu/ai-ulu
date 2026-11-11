// Cloudflare Worker: handles /api/lead only. All other routes are served
// by the static assets binding (see wrangler.jsonc -> run_worker_first).

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function sanitize(value, max = 2000) {
  return String(value ?? "")
    .slice(0, max)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim();
}

// Same-origin guard: a cross-site page must not be able to post leads or burn
// the rate limit. Requests without an Origin header (curl, same-origin form
// fallback) are allowed; browsers always send Origin on cross-origin POSTs.
function crossOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

// Validates an e-mail OR a phone-ish reach string. Kept permissive on purpose:
// users type either one and we only need a way to reply.
function validReach(value) {
  const v = value.trim();
  if (v.length < 5 || v.length > 160) return false;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phone = /^[+()\d\s.-]{7,}$/;
  return email.test(v) || phone.test(v);
}

// Cloudflare Turnstile check. Skipped entirely when TURNSTILE_SECRET is not set,
// so the form keeps working (honeypot + rate limit) until the secret is added.
// Fails closed: a verification error is treated as a failed challenge.
async function turnstileOk(env, request, token) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: clientIp(request) }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("turnstile verify failed", err);
    return false;
  }
}

function clientIp(request) {
  // Cloudflare always sets cf-connecting-ip and overwrites any client-supplied
  // value, so it is trustworthy at the edge. x-forwarded-for is attacker
  // controlled and must never be used as a fallback.
  return request.headers.get("cf-connecting-ip") || "unknown";
}

async function rateLimited(env, ip) {
  const windowMinutes = Number(env.RATE_LIMIT_WINDOW_MINUTES || 15);
  const maxSubs = Number(env.RATE_LIMIT_MAX_SUBMISSIONS || 5);
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const windowStart = now - windowMs;

  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (ip, window_started_at, submissions, updated_at)
     VALUES (?1, ?2, 1, ?2)
     ON CONFLICT(ip) DO UPDATE SET
       window_started_at = CASE WHEN rate_limits.window_started_at < ?3 THEN ?2 ELSE rate_limits.window_started_at END,
       submissions = CASE WHEN rate_limits.window_started_at < ?3 THEN 1 ELSE rate_limits.submissions + 1 END,
       updated_at = ?2
     RETURNING submissions, window_started_at`
  ).bind(ip, now, windowStart).first();

  return row && row.submissions > maxSubs;
}

// Page-view counter. Shares the rate_limits table but under a separate key, so a
// visitor browsing many pages cannot exhaust the lead-submission budget.
const HIT_MAX_PER_HOUR = 200;
async function hitRateLimited(env, ip) {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (ip, window_started_at, submissions, updated_at)
     VALUES (?1, ?2, 1, ?2)
     ON CONFLICT(ip) DO UPDATE SET
       window_started_at = CASE WHEN rate_limits.window_started_at < ?3 THEN ?2 ELSE rate_limits.window_started_at END,
       submissions = CASE WHEN rate_limits.window_started_at < ?3 THEN 1 ELSE rate_limits.submissions + 1 END,
       updated_at = ?2
     RETURNING submissions`
  ).bind(`hit:${ip}`, now, windowStart).first();
  return row && row.submissions > HIT_MAX_PER_HOUR;
}

const MAX_BODY_BYTES = 16 * 1024;
const LEAD_RETENTION_DAYS = 365;

async function handleLead(request, env) {
  if (request.method !== "POST") return json({ error: "Yöntem desteklenmiyor." }, 405);

  if (crossOrigin(request)) return json({ error: "Geçersiz istek." }, 403);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "Geçersiz istek." }, 415);
  }

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) return json({ error: "İstek çok büyük." }, 413);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "İstek çok büyük." }, 413);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ error: "Geçersiz istek." }, 400);
  }

  // Honeypot: bots fill hidden fields.
  if (sanitize(payload.company)) return json({ ok: true });

  // CAPTCHA (only when configured): a human must have solved the widget.
  if (!(await turnstileOk(env, request, payload["cf-turnstile-response"]))) {
    return json({ error: "Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin." }, 403);
  }

  const name = sanitize(payload.name, 120);
  const reach = sanitize(payload.reach, 160);
  const type = sanitize(payload.type, 40) || "unsure";
  const msg = sanitize(payload.msg, 2000);
  const budget = sanitize(payload.budget, 40);
  const utmSource = sanitize(payload.utm_source, 120);
  const utmCampaign = sanitize(payload.utm_campaign, 120);

  if (name.length < 2) return json({ error: "Lütfen adınızı yazın." }, 422);
  if (!validReach(reach)) return json({ error: "Geçerli bir e-posta veya telefon girin." }, 422);

  const ip = clientIp(request);
  let limited;
  try {
    limited = await rateLimited(env, ip);
  } catch (err) {
    // Fail closed: if the limiter itself is unavailable, do not accept an
    // unbounded stream of submissions.
    console.error("rate limit check failed", err);
    return json({ error: "Şu anda kayıt alınamıyor. Lütfen biraz sonra tekrar deneyin." }, 503);
  }
  if (limited) {
    return json({ error: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." }, 429);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const ua = sanitize(request.headers.get("user-agent"), 400);
  const page = sanitize(payload.page || request.headers.get("referer"), 300);

  try {
    await env.DB.prepare(
      `INSERT INTO leads (id, name, reach, project_type, budget, msg, utm_source, utm_campaign, ip, user_agent, page, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
    ).bind(id, name, reach, type, budget, msg, utmSource, utmCampaign, ip, ua, page, createdAt).run();
  } catch (err) {
    console.error("lead insert failed", err);
    return json({ error: "Kayıt oluşturulamadı. Lütfen e-posta ile ulaşın." }, 500);
  }

  // Notify by e-mail (best effort — never fail the request over this).
  try {
    await env.EMAIL.send({
      to: env.TO_EMAIL,
      from: env.FROM_EMAIL,
      subject: `Yeni teklif isteği: ${name}`,
      text: [
        `Ad: ${name}`,
        `İletişim: ${reach}`,
        `Tür: ${type}`,
        `Bütçe: ${budget || "-"}`,
        `Mesaj: ${msg || "-"}`,
        `Kaynak: ${[utmSource, utmCampaign].filter(Boolean).join(" / ") || "-"}`,
        `IP: ${ip}`,
        `Sayfa: ${page}`,
        `Zaman: ${createdAt}`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("email send failed", err);
  }

  // Also ping Telegram, so a lead is seen within minutes even when e-mail is
  // slow. Best effort: skipped entirely when the secrets are not set.
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: [
            "🔔 Yeni teklif isteği",
            `Ad: ${name}`,
            `İletişim: ${reach}`,
            `Tür: ${type}`,
            `Bütçe: ${budget || "-"}`,
            `Mesaj: ${msg || "-"}`,
            `Kaynak: ${[utmSource, utmCampaign].filter(Boolean).join(" / ") || "-"}`,
          ].join("\n"),
          disable_web_page_preview: true,
        }),
      });
    } catch (err) {
      console.error("telegram send failed", err);
    }
  }

  return json({ ok: true });
}

// Page-view beacon. Deliberately narrow: the client sends only the path, and
// the server derives the day, the referrer host and the country itself. Nothing
// here identifies a visitor, and a failure is swallowed — analytics must never
// cost a page a request.
async function handleHit(request, env) {
  if (request.method !== "POST") return json({ error: "Yöntem desteklenmiyor." }, 405);
  if (crossOrigin(request)) return json({ error: "Geçersiz istek." }, 403);

  let payload = {};
  try {
    payload = JSON.parse((await request.text()).slice(0, 512)) || {};
  } catch {
    return json({ ok: true });
  }

  const path = sanitize(payload.path, 300) || "/";
  if (!path.startsWith("/")) return json({ ok: true });

  const ip = clientIp(request);
  const day = new Date().toISOString().slice(0, 10);
  const country = sanitize(request.headers.get("cf-ipcountry"), 8);
  let referrerHost = "";
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const host = new URL(referer).host;
      if (host && host !== new URL(request.url).host) referrerHost = host;
    } catch {
      /* a malformed referrer is simply not counted */
    }
  }

  try {
    if (await hitRateLimited(env, ip)) return json({ ok: true });
    await env.DB.prepare(
      `INSERT INTO hits (day, path, referrer_host, country, views)
       VALUES (?1, ?2, ?3, ?4, 1)
       ON CONFLICT(day, path, referrer_host, country) DO UPDATE SET views = views + 1`
    ).bind(day, path, referrerHost, country).run();
  } catch (err) {
    console.error("hit insert failed", err);
  }
  return json({ ok: true });
}

// Client-side error sink. Browsers post uncaught errors and rejections here and
// they land in Cloudflare Workers Logs (Workers → Logs), so a broken deploy is
// visible without a third-party SDK. Nothing is stored in D1: the log line is
// the record, and it is deliberately capped so a noisy client cannot flood it.
async function handleError(request) {
  if (request.method !== "POST") return json({ error: "Yöntem desteklenmiyor." }, 405);
  if (crossOrigin(request)) return json({ error: "Geçersiz istek." }, 403);

  let payload = {};
  try {
    payload = JSON.parse((await request.text()).slice(0, 2048)) || {};
  } catch {
    return json({ ok: true });
  }

  const message = sanitize(payload.message, 300);
  if (!message) return json({ ok: true });

  console.error("client error", {
    message,
    source: sanitize(payload.source, 200),
    line: sanitize(payload.line, 20),
    col: sanitize(payload.col, 20),
    stack: sanitize(payload.stack, 800),
    path: sanitize(payload.path, 300),
    ua: sanitize(request.headers.get("user-agent"), 300),
  });
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lead") {
      return handleLead(request, env);
    }
    if (url.pathname === "/api/hit") {
      return handleHit(request, env);
    }
    if (url.pathname === "/api/error") {
      return handleError(request);
    }
    return new Response("Not found", { status: 404 });
  },

  // Cron: drop stale rate-limit rows and leads past the retention window so the
  // database cannot grow without bound and personal data is not kept forever.
  async scheduled(_event, env) {
    const now = Date.now();
    const leadCutoff = new Date(now - LEAD_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const windowMs = Number(env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000;
    const rateCutoff = now - windowMs;
    // Page views are anonymous, but they still do not need to live forever.
    const hitCutoff = new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    try {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM leads WHERE created_at < ?1").bind(leadCutoff),
        env.DB.prepare("DELETE FROM rate_limits WHERE window_started_at < ?1").bind(rateCutoff),
        env.DB.prepare("DELETE FROM hits WHERE day < ?1").bind(hitCutoff),
      ]);
    } catch (err) {
      console.error("retention cleanup failed", err);
    }
  },
};
