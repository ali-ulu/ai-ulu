import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Playwright's own download can be unavailable (offline sandboxes); when a system
// Chromium is present we point at it instead, which also needs --no-sandbox
// because the container has no user namespaces. CI installs the bundled browser
// and this override is skipped.
const systemChromium = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));

const launchOptions = systemChromium
  ? { executablePath: systemChromium, args: ["--no-sandbox"] }
  : {};

// E2E runs against the built dist/ served by scripts/serve.mjs, which mirrors the
// Cloudflare assets binding (index.html for directories, 404.html for unknowns)
// and stubs /api/*. Chromium only: the site has no browser-specific behaviour.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "line",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions } }],
  webServer: {
    command: "node scripts/serve.mjs",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
