import { expect, test } from "@playwright/test";

test("pSEO lookup funnel renders and navigation responds", async ({ page, isMobile }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/tra-cuu/sao-thai-am-cung-tai-bach");
  await expect(page).toHaveTitle(/Thái Âm cung Tài Bạch/);
  await expect(page.locator("h1")).toContainText("Thái Âm");
  await expect(page.locator(".pseo-summary-table")).toBeVisible();
  await expect(page.locator("#lap-la-so-ca-nhan")).toBeVisible();
  await expect(page.getByTestId("chart-form")).toBeVisible();
  await expect(page.locator(".pseo-related-group")).toHaveCount(2);

  if (isMobile) {
    await page.locator(".mobile-site-menu > summary").click();
    await page.locator(".mobile-lookup-group > summary").click();
    await expect(page.locator('.mobile-lookup-group a[href="/tra-cuu/y-nghia-14-chinh-tinh"]')).toBeVisible();
    await expect(page.locator(".pseo-vip-sidebar")).toBeHidden();
    await expect(page.locator(".pseo-mobile-vip")).toBeVisible();
  } else {
    await page.locator(".site-lookup-menu > summary").click();
    await expect(page.locator(".site-lookup-panel")).toBeVisible();
    await expect(page.locator('.site-lookup-panel a[href="/tra-cuu/y-nghia-12-cung"]')).toBeVisible();
    await expect(page.locator(".pseo-vip-sidebar")).toBeVisible();
  }

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Ý nghĩa Chính Tinh" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath(isMobile ? "pseo-mobile.png" : "pseo-desktop.png"), fullPage: true });
  expect(errors).toEqual([]);
});
