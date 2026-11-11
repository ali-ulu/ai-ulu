# Security Policy

## Reporting a vulnerability

E-mail **aliulu@ai-ulu.com** with a description and, if possible, reproduction
steps. Please do not open a public issue for security problems. You will get a
reply within a few days.

## Scope

- `src/worker.js` — the `/api/lead` Cloudflare Worker (the only server-side code)
- `src/site/` and `scripts/` — static site generator
- `.github/workflows/deploy.yml` — CI/CD

## Hardening in place

- All D1 queries are parameterized; no string concatenation of user input.
- Input is sanitized (control characters stripped, length capped) and pages are
  HTML-escaped; the CSP is `'self'`-only with no inline scripts.
- Security headers are served from `dist/_headers` (CSP, HSTS, nosniff,
  frame-ancestors, Referrer-Policy, Permissions-Policy).
- `/api/lead` enforces same-origin, JSON content type, a 16 KB body cap, a
  honeypot, and a per-IP rate limit that fails closed.
- A daily cron (`src/worker.js` `scheduled`) deletes stale rate-limit rows and
  leads older than the retention window.

## Operational checklist (owner)

- [ ] **E-mail authentication (SPF/DKIM/DMARC).** `noreply@ai-ulu.com` sends to a
      real inbox via Cloudflare Email. Verify the SPF, DKIM and DMARC DNS records
      for `ai-ulu.com` so the domain cannot be spoofed. This cannot be done from
      the code repository.
- [ ] **D1 retention.** Confirm the daily cron runs (`wrangler tail` shows the
      scheduled invocation) and that the 12-month retention in
      `src/site/pages.mjs` matches the policy you publish.
- [ ] **Secrets.** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` live only in
      repository secrets; never commit them.
