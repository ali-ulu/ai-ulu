// Lead and traffic summary straight from D1. Read-only.
//   node scripts/report.mjs                 (last 30 days, local)
//   node scripts/report.mjs --days 90 --remote
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const daysArg = args.indexOf("--days");
const days = daysArg >= 0 ? Number(args[daysArg + 1]) || 30 : 30;
const remote = args.includes("--remote");
const DB_NAME = "ai-ulu-leads";

function query(sql) {
  const out = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DB_NAME, remote ? "--remote" : "--local", "--json", "--command", sql],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const start = out.indexOf("[");
  return JSON.parse(out.slice(start))[0]?.results ?? [];
}

const since = new Date(Date.now() - days * 86400000).toISOString();

const totals = query(`SELECT COUNT(*) AS leads FROM leads WHERE created_at >= '${since}'`)[0] ?? {};
const byBudget = query(
  `SELECT budget, COUNT(*) AS n FROM leads WHERE created_at >= '${since}' GROUP BY budget ORDER BY n DESC`,
);
const bySource = query(
  `SELECT utm_source, utm_campaign, COUNT(*) AS n FROM leads WHERE created_at >= '${since}' GROUP BY utm_source, utm_campaign ORDER BY n DESC`,
);
const byType = query(
  `SELECT project_type, COUNT(*) AS n FROM leads WHERE created_at >= '${since}' GROUP BY project_type ORDER BY n DESC`,
);
const views = query(`SELECT SUM(views) AS views FROM hits WHERE day >= '${since.slice(0, 10)}'`)[0] ?? {};
const topPages = query(
  `SELECT path, SUM(views) AS views FROM hits WHERE day >= '${since.slice(0, 10)}' GROUP BY path ORDER BY views DESC LIMIT 10`,
);
const topReferrers = query(
  `SELECT referrer_host, SUM(views) AS views FROM hits WHERE day >= '${since.slice(0, 10)}' AND referrer_host != '' GROUP BY referrer_host ORDER BY views DESC LIMIT 10`,
);
const topCountries = query(
  `SELECT country, SUM(views) AS views FROM hits WHERE day >= '${since.slice(0, 10)}' AND country != '' GROUP BY country ORDER BY views DESC LIMIT 10`,
);

const line = (label, value) => console.log(`${label.padEnd(22)} ${value}`);
const table = (title, rows, key) => {
  console.log(`\n${title}`);
  if (!rows.length) return console.log("  (veri yok)");
  for (const r of rows) console.log(`  ${String(r[key] ?? "-").padEnd(26)} ${r.n ?? r.views}`);
};

console.log(`ai-ulu raporu · son ${days} gün · ${remote ? "uzak" : "yerel"} D1\n`);
line("Lead (form):", totals.leads ?? 0);
line("Sayfa görüntüleme:", views.views ?? 0);
const conv = views.views ? (((totals.leads ?? 0) / views.views) * 100).toFixed(2) : "0.00";
line("Dönüşüm (lead/view):", `${conv}%`);

table("Bütçe aralığı", byBudget, "budget");
table("Proje türü", byType, "project_type");
table("Kaynak (UTM)", bySource, "utm_source");
table("En çok görüntülenen sayfalar", topPages, "path");
table("Yönlendiren siteler", topReferrers, "referrer_host");
table("Ülkeler", topCountries, "country");
