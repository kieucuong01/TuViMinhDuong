import { expect, test } from "@playwright/test";

test.describe("read-only public journeys", () => {
  test("home exposes the free chart entry point", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("chart-form")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https?:\/\/[^/]+/,
    );
  });

  test("mobile chart name field stays focusable and keyboard-safe", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const nameInput = page.getByTestId("chart-full-name");

    await nameInput.tap();
    await expect(nameInput).toBeFocused();
    await page.keyboard.insertText("An");
    await expect(nameInput).toHaveValue("An");

    await expect.poll(async () => Number.parseFloat(await nameInput.evaluate((input) => window.getComputedStyle(input).fontSize)))
      .toBeGreaterThanOrEqual(16);
    await expect.poll(async () => nameInput.evaluate((input) => input.getBoundingClientRect().height))
      .toBeGreaterThanOrEqual(44);
  });

  test("date tool explains the task and responds to local controls", async ({ page }) => {
    await page.goto("/xem-ngay");
    await expect(page.getByRole("heading", { level: 1, name: "Xem ngày tốt theo tuổi cho từng việc" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Lối tắt xem ngày theo nhu cầu" })).toBeVisible();
    const initialDate = await page.getByTestId("date-input").inputValue();
    await page.getByTestId("date-next-button").click();
    await expect(page.getByTestId("date-input")).not.toHaveValue(initialDate);
  });

  test("knowledge hub remains indexable and navigable", async ({ page }) => {
    await page.goto("/kien-thuc-tu-vi");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/kien-thuc-tu-vi$/);
    await expect(page.locator('a[href^="/kien-thuc-tu-vi/"]').first()).toBeVisible();
  });
});
