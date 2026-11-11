import { test, expect } from "@playwright/test";

// Critical paths a visitor takes. These run against the built site, so a change
// that breaks the form, the WhatsApp handoff or the 404 page fails here.

test("home loads with a working lead form that submits and confirms", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ai-ulu/);

  const form = page.locator("#lead-form");
  await expect(form).toBeVisible();

  await page.fill("#name", "Test Ziyaretçi");
  await page.fill("#reach", "test@example.com");
  await page.fill("#msg", "Merhaba, bir site istiyorum.");
  await form.locator('button[type="submit"]').click();

  // The success path hides the form and reveals the thank-you block.
  await expect(page.locator("#pm-thanks")).toBeVisible({ timeout: 5000 });
  await expect(form).toBeHidden();
});

test("the lead form will not submit while required fields are empty", async ({ page }) => {
  await page.goto("/");
  let posted = false;
  await page.route("**/api/lead", (route) => {
    posted = true;
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
  });
  await page.locator('#lead-form button[type="submit"]').click();
  // Required fields block the submit, so nothing is sent and the form stays.
  await expect(page.locator("#lead-form")).toBeVisible();
  expect(await page.locator("#name").evaluate((el) => !el.checkValidity())).toBe(true);
  expect(posted).toBe(false);
});

test("WhatsApp links point at wa.me with the number", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[href^="https://wa.me/"]');
  expect(await links.count()).toBeGreaterThan(0);
  const href = await links.first().getAttribute("href");
  expect(href).toContain("wa.me/905079581642");
});

test("unknown paths render the custom 404 with a way out", async ({ page }) => {
  const res = await page.goto("/bu-sayfa-yok/");
  expect(res.status()).toBe(404);
  await expect(page.locator("h1")).toContainText(/bulamadık/i);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});

test("sablonlar shows exactly one h1 and a no-JS fallback exists", async ({ page }) => {
  await page.goto("/sablonlar/");
  await expect(page.locator("h1")).toHaveCount(1);
  const noscript = await page.locator("noscript").first().innerHTML();
  expect(noscript).toContain("Hangi tarz");
});

test("blog post shows a visible author byline and date", async ({ page }) => {
  await page.goto("/blog/yapay-zeka-aramalarinda-gorunmek/");
  await expect(page.locator(".bl-author")).toHaveText("Ali Ulu");
  await expect(page.locator(".bl-meta time")).toBeVisible();
});

test("breadcrumbs are visible and marked up", async ({ page }) => {
  await page.goto("/blog/");
  const crumbs = page.locator(".crumbs");
  await expect(crumbs).toBeVisible();
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText("Blog");
});

// The home hero is a scroll-scrubbed film. It must never trap the reader: the
// opening chapter is readable at the top, the page still scrolls past it, and a
// machine without WebGL gets the flat column instead of a blank stage.
test("the home film shows its opening chapter and scrolls past", async ({ page }) => {
  await page.goto("/");
  const c0 = page.locator("#c0");
  await expect(c0).toBeVisible();
  await expect(c0.locator("h1")).toContainText("Müşteri getiren");
  await expect(c0.locator(".btn")).toHaveAttribute("href", /wa\.me/);

  // The film is tall only when the 3D path runs; without WebGL it flattens.
  const { height, no3d } = await page.evaluate(() => ({
    height: document.querySelector("#film").offsetHeight,
    no3d: document.documentElement.classList.contains("no-3d"),
  }));
  if (no3d) expect(height).toBeLessThan(4000);
  else expect(height).toBeGreaterThan(2000);

  // Either way the page scrolls on to the sections that follow the film.
  await page.locator("#nasil").scrollIntoViewIfNeeded();
  await expect(page.locator("#nasil")).toBeVisible();
});

test("the film degrades to a readable column when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function () { return null; };
  });
  await page.goto("/");
  await expect(page.locator("#c0 h1")).toBeVisible();
  await expect(page.locator("#c4 h2")).toBeVisible();
  await expect(page.locator("#film")).toHaveCSS("height", /^(auto|1[0-9]{3}|[0-9]{3})/);
});
