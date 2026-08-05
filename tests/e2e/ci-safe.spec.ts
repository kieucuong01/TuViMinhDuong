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
