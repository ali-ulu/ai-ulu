// robots.txt for the static build. AI crawlers are listed explicitly so the
// site stays visible in AI answers (see also llms.txt).
export function robotsTxt(site) {
  const aiCrawlers = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended"];
  const agents = aiCrawlers.map((ua) => `User-agent: ${ua}\nAllow: /`).join("\n\n");
  return `# ${new URL(site.url).host}
User-agent: *
Allow: /

# AI crawlers are explicitly welcome: this site publishes llms.txt for them.
${agents}

Sitemap: ${site.url}/sitemap.xml
`;
}
