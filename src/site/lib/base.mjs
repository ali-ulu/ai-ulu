// GitHub Pages serves a project site under a sub-path (/ai-ulu/), while the
// Cloudflare deployment serves the same output at the root. The generator emits
// root-absolute URLs ("/blog/", "/site.css"), so this pass prefixes them with the
// configured base. base "/" is a no-op, which keeps the root deployment byte-identical.

export function normalizeBase(value) {
  const raw = String(value || "/").trim();
  if (!raw || raw === "/") return "/";
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
}

// Rewrite root-absolute references so the same dist/ works under any base.
// Absolute URLs (https://…), protocol-relative (//…), data: and bare fragments
// (#…) are left alone.
export function applyBase(content, base) {
  if (base === "/") return content;
  let out = content
    // href="/x" src="/x" action="/x" poster="/x" content="/x"
    .replace(/\b(href|src|action|poster|content)="\/(?!\/)/g, `$1="${base}`)
    // CSS url(/x)
    .replace(/url\(\s*\/(?!\/)/g, `url(${base}`)
    // fetch("/api/…") in the client script
    .replace(/"\/api\//g, `"${base}api/`);
  // Web app manifest: start_url, scope and icon src are root-absolute.
  out = out
    .replace(/"start_url":\s*"\/"/g, `"start_url": "${base}"`)
    .replace(/"scope":\s*"\/"/g, `"scope": "${base}"`)
    .replace(/"src":\s*"\/(?!\/)/g, `"src": "${base}`);
  return out;
}

// File kinds the pass touches. Everything else (fonts, images, source maps) is
// binary or carries no root-absolute URL.
export const BASE_FILE_RE = /\.(html|css|js|mjs|json|webmanifest|xml|txt)$/;
