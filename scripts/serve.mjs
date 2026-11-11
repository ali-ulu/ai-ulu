// Minimal static server for the E2E run. Serves dist/ the way the Cloudflare
// assets binding does: directory URLs get index.html, unknown paths get 404.html
// with a 404 status. /api/* is answered here so the form flow can be exercised
// without the Worker or D1.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

async function fileFor(pathname) {
  const clean = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let target = join(root, clean);
  if (!target.startsWith(root)) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, "index.html");
  } catch {
    if (!extname(target)) target += ".html";
  }
  try {
    return { body: await readFile(target), type: TYPES[extname(target)] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname.startsWith("/api/")) {
    let body = "";
    for await (const chunk of req) body += chunk;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const found = await fileFor(url.pathname);
  if (found) {
    res.writeHead(200, { "content-type": found.type });
    res.end(found.body);
    return;
  }
  const notFound = await fileFor("/404.html");
  res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
  res.end(notFound?.body ?? "Not found");
}).listen(port, () => console.log(`e2e server on http://localhost:${port}`));
