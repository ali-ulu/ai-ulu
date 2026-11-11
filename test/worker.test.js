import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

// Minimal D1 + EMAIL fakes that exercise the real handler logic.

function makeDb() {
  const leads = [];
  const rates = new Map();
  const hits = [];
  const deleted = { leads: 0, rates: 0, hits: 0 };
  const db = {
    leads,
    rates,
    hits,
    deleted,
    prepare(sql) {
      const stmt = {
        _args: [],
        bind(...args) { this._args = args; return this; },
        async run() {
          if (sql.includes("INSERT INTO leads")) {
            const [id, name, reach, project_type, budget, msg, utm_source, utm_campaign, ip, user_agent, page, created_at] = this._args;
            leads.push({ id, name, reach, project_type, budget, msg, utm_source, utm_campaign, ip, user_agent, page, created_at });
          }
          if (sql.includes("INSERT INTO hits")) {
            const [day, path, referrer_host, country] = this._args;
            const existing = hits.find((h) => h.day === day && h.path === path && h.referrer_host === referrer_host && h.country === country);
            if (existing) existing.views += 1;
            else hits.push({ day, path, referrer_host, country, views: 1 });
          }
          if (sql.includes("DELETE FROM leads")) {
            const [cutoff] = this._args;
            for (let i = leads.length - 1; i >= 0; i--) {
              if (leads[i].created_at < cutoff) { leads.splice(i, 1); deleted.leads++; }
            }
          }
          if (sql.includes("DELETE FROM rate_limits")) {
            const [cutoff] = this._args;
            for (const [ip, row] of rates) {
              if (row.window_started_at < cutoff) { rates.delete(ip); deleted.rates++; }
            }
          }
          if (sql.includes("DELETE FROM hits")) {
            const [cutoff] = this._args;
            for (let i = hits.length - 1; i >= 0; i--) {
              if (hits[i].day < cutoff) { hits.splice(i, 1); deleted.hits++; }
            }
          }
          return { success: true };
        },
        async first() {
          if (sql.includes("INSERT INTO rate_limits")) {
            const [ip, now, windowStart] = this._args;
            const cur = rates.get(ip);
            if (!cur || cur.window_started_at < windowStart) {
              const row = { ip, window_started_at: now, submissions: 1, updated_at: now };
              rates.set(ip, row);
              return { submissions: row.submissions, window_started_at: row.window_started_at };
            }
            cur.submissions += 1;
            cur.updated_at = now;
            return { submissions: cur.submissions, window_started_at: cur.window_started_at };
          }
          return null;
        },
      };
      return stmt;
    },
    async batch(statements) {
      for (const s of statements) await s.run();
      return [];
    },
  };
  return db;
}

function makeEnv(extra = {}) {
  return {
    DB: makeDb(),
    EMAIL: { sent: [], async send(m) { this.sent.push(m); return { ok: true }; } },
    TO_EMAIL: "aliulu@ai-ulu.com",
    FROM_EMAIL: "noreply@ai-ulu.com",
    RATE_LIMIT_WINDOW_MINUTES: "15",
    RATE_LIMIT_MAX_SUBMISSIONS: "5",
    ...extra,
  };
}

function post(body, headers = {}) {
  return new Request("https://ai-ulu.com/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "1.2.3.4", ...headers },
    body: JSON.stringify(body),
  });
}

test("valid submission stores a lead and sends email", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Ayşe Yılmaz", reach: "ayse@example.com", type: "business", msg: "Klinik sitesi" }), env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(env.DB.leads.length, 1);
  assert.equal(env.DB.leads[0].name, "Ayşe Yılmaz");
  assert.equal(env.EMAIL.sent.length, 1);
});

test("honeypot silently accepts but stores nothing", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Bot", reach: "bot@example.com", company: "spam inc" }), env);
  assert.equal(res.status, 200);
  assert.equal(env.DB.leads.length, 0);
});

test("rejects missing name", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "", reach: "a@b.com" }), env);
  assert.equal(res.status, 422);
});

test("rejects invalid reach", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Ali", reach: "xx" }), env);
  assert.equal(res.status, 422);
});

test("accepts phone number as reach", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Ali Ulu", reach: "+90 500 000 00 00" }), env);
  assert.equal(res.status, 200);
});

test("rate limits after max submissions from one IP", async () => {
  const env = makeEnv();
  for (let i = 0; i < 5; i++) {
    const res = await worker.fetch(post({ name: `User ${i}`, reach: "a@b.com" }), env);
    assert.equal(res.status, 200);
  }
  const res = await worker.fetch(post({ name: "Sixth", reach: "a@b.com" }), env);
  assert.equal(res.status, 429);
});

test("rejects non-POST", async () => {
  const env = makeEnv();
  const res = await worker.fetch(new Request("https://ai-ulu.com/api/lead", { method: "GET" }), env);
  assert.equal(res.status, 405);
});

test("unknown route returns 404", async () => {
  const env = makeEnv();
  const res = await worker.fetch(new Request("https://ai-ulu.com/api/other"), env);
  assert.equal(res.status, 404);
});

test("sanitizes control characters in message", async () => {
  const env = makeEnv();
  await worker.fetch(post({ name: "Ali", reach: "a@b.com", msg: "hello\u0000world" }), env);
  assert.ok(!env.DB.leads[0].msg.includes("\u0000"));
});

test("null JSON body returns 400, not 500", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post(null), env);
  assert.equal(res.status, 400);
});

test("array JSON body returns 400", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post([1, 2, 3]), env);
  assert.equal(res.status, 400);
});

test("cross-origin request is rejected", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }, { origin: "https://evil.example" }), env);
  assert.equal(res.status, 403);
  assert.equal(env.DB.leads.length, 0);
});

test("same-origin request is accepted", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }, { origin: "https://ai-ulu.com" }), env);
  assert.equal(res.status, 200);
});

test("non-JSON content type is rejected with 415", async () => {
  const env = makeEnv();
  const req = new Request("https://ai-ulu.com/api/lead", {
    method: "POST",
    headers: { "content-type": "text/plain", "cf-connecting-ip": "1.2.3.4" },
    body: JSON.stringify({ name: "Ali", reach: "a@b.com" }),
  });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 415);
});

test("oversized body is rejected with 413", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com", msg: "A".repeat(20_000) }), env);
  assert.equal(res.status, 413);
  assert.equal(env.DB.leads.length, 0);
});

test("CRLF in name cannot inject email headers", async () => {
  const env = makeEnv();
  await worker.fetch(post({ name: "A".repeat(130) + "\r\nBcc: victim@evil.com", reach: "a@b.com" }), env);
  const stored = env.DB.leads[0].name;
  assert.ok(!/[\r\n]/.test(stored), "stored name must not contain CR or LF");
  const subject = env.EMAIL.sent[0].subject;
  assert.ok(!/[\r\n]/.test(subject), "email subject must not contain CR or LF");
});

test("rate limit fails closed when the database is unavailable", async () => {
  const env = makeEnv();
  env.DB.prepare = () => { throw new Error("d1 down"); };
  const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }), env);
  assert.equal(res.status, 503);
});

test("scheduled cleanup deletes leads and rate rows past retention", async () => {
  const env = makeEnv();
  const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
  env.DB.leads.push({ id: "old", name: "x", reach: "a@b.com", project_type: "unsure", msg: "", ip: "1.1.1.1", user_agent: "", page: "", created_at: old });
  env.DB.rates.set("9.9.9.9", { ip: "9.9.9.9", window_started_at: Date.now() - 60 * 60 * 1000, submissions: 3, updated_at: 0 });
  await worker.scheduled({}, env);
  assert.equal(env.DB.leads.length, 0);
  assert.equal(env.DB.rates.size, 0);
});

test("stores budget and campaign attribution when the form sends them", async () => {
  const env = makeEnv();
  const res = await worker.fetch(
    post({ name: "Ayşe Yılmaz", reach: "ayse@example.com", type: "both", budget: "25-50", msg: "Klinik", utm_source: "instagram", utm_campaign: "kasim" }),
    env
  );
  assert.equal(res.status, 200);
  const lead = env.DB.leads[0];
  assert.equal(lead.budget, "25-50");
  assert.equal(lead.utm_source, "instagram");
  assert.equal(lead.utm_campaign, "kasim");
  assert.match(env.EMAIL.sent[0].text, /Bütçe: 25-50/);
  assert.match(env.EMAIL.sent[0].text, /Kaynak: instagram \/ kasim/);
});

test("budget and attribution default to empty strings when absent", async () => {
  const env = makeEnv();
  await worker.fetch(post({ name: "Ali", reach: "a@b.com" }), env);
  assert.equal(env.DB.leads[0].budget, "");
  assert.equal(env.DB.leads[0].utm_source, "");
  assert.equal(env.DB.leads[0].utm_campaign, "");
});

test("telegram is notified when the secrets are configured", async () => {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return { ok: true };
  };
  try {
    const env = makeEnv({ TELEGRAM_BOT_TOKEN: "bot-token", TELEGRAM_CHAT_ID: "42" });
    const res = await worker.fetch(post({ name: "Ayşe", reach: "ayse@example.com", budget: "100+" }), env);
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /api\.telegram\.org\/botbot-token\/sendMessage/);
    assert.equal(calls[0].body.chat_id, "42");
    assert.match(calls[0].body.text, /Bütçe: 100\+/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("telegram is skipped when the secrets are missing", async () => {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => { calls.push(args); return { ok: true }; };
  try {
    const env = makeEnv();
    const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }), env);
    assert.equal(res.status, 200);
    assert.equal(calls.length, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// --- /api/hit: anonymous page-view counting -------------------------------

function hit(body, headers = {}) {
  return new Request("https://ai-ulu.com/api/hit", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "1.2.3.4", ...headers },
    body: JSON.stringify(body),
  });
}

test("hit records an anonymous row with day, path, referrer host and country", async () => {
  const env = makeEnv();
  const res = await worker.fetch(hit({ path: "/blog/" }, { referer: "https://www.google.com/search", "cf-ipcountry": "TR" }), env);
  assert.equal(res.status, 200);
  assert.equal(env.DB.hits.length, 1);
  const row = env.DB.hits[0];
  assert.equal(row.path, "/blog/");
  assert.equal(row.referrer_host, "www.google.com");
  assert.equal(row.country, "TR");
  assert.equal(row.views, 1);
  assert.match(row.day, /^\d{4}-\d{2}-\d{2}$/);
});

test("hits to the same path on the same day increment one row", async () => {
  const env = makeEnv();
  await worker.fetch(hit({ path: "/" }), env);
  await worker.fetch(hit({ path: "/" }), env);
  assert.equal(env.DB.hits.length, 1);
  assert.equal(env.DB.hits[0].views, 2);
});

test("same-site referrer is not recorded as an external source", async () => {
  const env = makeEnv();
  await worker.fetch(hit({ path: "/blog/" }, { referer: "https://ai-ulu.com/" }), env);
  assert.equal(env.DB.hits[0].referrer_host, "");
});

test("hit accepts GET-less junk without throwing and never stores a bad path", async () => {
  const env = makeEnv();
  const res = await worker.fetch(hit({ path: "not-a-path" }), env);
  assert.equal(res.status, 200);
  assert.equal(env.DB.hits.length, 0);
});

test("hit rejects cross-origin requests", async () => {
  const env = makeEnv();
  const res = await worker.fetch(hit({ path: "/" }, { origin: "https://evil.example" }), env);
  assert.equal(res.status, 403);
  assert.equal(env.DB.hits.length, 0);
});

test("hit does not spend the lead rate-limit budget", async () => {
  const env = makeEnv();
  for (let i = 0; i < 8; i++) await worker.fetch(hit({ path: "/" }), env);
  // Eight page views must not block a real submission from the same IP.
  const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }), env);
  assert.equal(res.status, 200);
});

test("retention cleanup also prunes old hits", async () => {
  const env = makeEnv();
  env.DB.hits.push({ day: "2000-01-01", path: "/", referrer_host: "", country: "", views: 5 });
  await worker.scheduled({}, env);
  assert.equal(env.DB.deleted.hits, 1);
  assert.equal(env.DB.hits.length, 0);
});

test("a telegram failure never fails the request", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("network down"); };
  try {
    const env = makeEnv({ TELEGRAM_BOT_TOKEN: "bot-token", TELEGRAM_CHAT_ID: "42" });
    const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }), env);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ---------------------------------------------------------------- Turnstile
test("turnstile is skipped when no secret is configured", async () => {
  const env = makeEnv();
  const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }), env);
  assert.equal(res.status, 200);
  assert.equal(env.DB.leads.length, 1);
});

test("turnstile blocks a submission with no token when configured", async () => {
  const env = makeEnv({ TURNSTILE_SECRET: "s3cret" });
  const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com" }), env);
  assert.equal(res.status, 403);
  assert.equal(env.DB.leads.length, 0);
});

test("turnstile accepts a submission when the challenge passes", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(String(url), /siteverify/);
    return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
  };
  try {
    const env = makeEnv({ TURNSTILE_SECRET: "s3cret" });
    const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com", "cf-turnstile-response": "token" }), env);
    assert.equal(res.status, 200);
    assert.equal(env.DB.leads.length, 1);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("turnstile fails closed when verification errors", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("network down"); };
  try {
    const env = makeEnv({ TURNSTILE_SECRET: "s3cret" });
    const res = await worker.fetch(post({ name: "Ali", reach: "a@b.com", "cf-turnstile-response": "token" }), env);
    assert.equal(res.status, 403);
    assert.equal(env.DB.leads.length, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ------------------------------------------------------------ error logging
test("client error endpoint logs and always returns ok", async () => {
  const logged = [];
  const realError = console.error;
  console.error = (...args) => logged.push(args);
  try {
    const env = makeEnv();
    const req = new Request("https://ai-ulu.com/api/error", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "1.2.3.4" },
      body: JSON.stringify({ message: "boom", source: "/app.js", line: 10, path: "/" }),
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
    assert.ok(logged.some((l) => l[0] === "client error" && l[1].message === "boom"), "error is logged");
  } finally {
    console.error = realError;
  }
});

test("client error endpoint ignores junk and cross-origin posts", async () => {
  const env = makeEnv();
  const junk = new Request("https://ai-ulu.com/api/error", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not json",
  });
  assert.equal((await worker.fetch(junk, env)).status, 200);

  const cross = new Request("https://ai-ulu.com/api/error", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ message: "x" }),
  });
  assert.equal((await worker.fetch(cross, env)).status, 403);
});
