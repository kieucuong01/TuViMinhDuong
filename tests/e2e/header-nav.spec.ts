import { expect, test } from "@playwright/test";

test.describe("desktop header navigation", () => {
  test("closes a flyout after clicking one of its submenu links", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const articleMenu = page.locator(".site-article-menu");
    const articlePanel = articleMenu.locator(".site-lookup-panel");

    await articleMenu.locator("a[aria-haspopup='true']").hover();
    await expect(articlePanel).toBeVisible();

    await articlePanel.locator('a[href="/tra-cuu"]').click();
    await page.waitForURL(/\/tra-cuu$/);

    await expect(articlePanel).toBeHidden();
  });
});
