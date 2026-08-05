import { expect, test } from "@playwright/test";

test("production CSP blocks eval while the allowed Google tag path still executes", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy|refused to/i.test(message.text())) {
      browserErrors.push(message.text());
    }
  });
  await page.route("https://www.googletagmanager.com/gtag/js**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.__safeGoogleTagLoaded = true;",
    });
  });

  const response = await page.goto("/");
  const csp = (await response?.allHeaders())?.["content-security-policy"] || "";

  expect(csp).toContain("script-src");
  expect(csp).not.toContain("'unsafe-eval'");
  await expect(page.locator('script#lsth-google-tag[src*="googletagmanager.com/gtag/js"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { __safeGoogleTagLoaded?: boolean }).__safeGoogleTagLoaded))).toBe(true);
  expect(browserErrors).toEqual([]);
});
