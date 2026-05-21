import { expect, test } from "@playwright/test";
import { adminCredentials, createSmokeChart } from "./helpers";

test.describe("core smoke flows", () => {
  test("guest can create a free chart and read the basic result", async ({ page }) => {
    await createSmokeChart(page);

    await expect(page.getByTestId("free-reading-panel")).toBeVisible();
    await expect(page.getByTestId("chart-action-panel")).toBeVisible();
    await expect(page.getByTestId("premium-reading-cta-bottom")).toBeVisible();
  });

  test("guest paid reading redirects to login paywall", async ({ page }) => {
    await createSmokeChart(page, `Guest Paywall ${Date.now()}`);

    const premiumCta = page.getByTestId("premium-reading-cta-bottom");
    await expect(premiumCta).toBeVisible();
    await premiumCta.getByRole("button").click();

    await expect(page).toHaveURL(/\/dang-nhap\?/);
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("paywall-popup")).toBeVisible();
  });

  test("date view updates date and birth year inputs", async ({ page }) => {
    await page.goto("/xem-ngay");
    await expect(page.getByTestId("date-view")).toBeVisible();

    await page.getByTestId("date-input").fill("2026-05-19");
    await page.getByTestId("birth-year-input").fill("1994");

    await expect(page.getByTestId("date-input")).toHaveValue("2026-05-19");
    await expect(page.getByTestId("birth-year-input")).toHaveValue("1994");
    await expect(page.getByTestId("date-view").getByText("Theo việc cần làm").first()).toBeVisible();
  });

  test("evergreen article renders metadata scripts and FAQ content", async ({ page }) => {
    await page.goto("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");

    await expect(page.getByRole("heading", { name: /Giờ sinh trong tử vi/i })).toBeVisible();
    await expect(page.locator("#article-jsonld")).toHaveCount(1);
    await expect(page.locator("#breadcrumb-jsonld")).toHaveCount(1);
    await expect(page.locator("#faq-jsonld")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /Câu hỏi thường gặp/i })).toBeVisible();
  });

  test("admin can log in and open the dashboard", async ({ page }) => {
    const { email, password } = adminCredentials();
    test.skip(!email || !password, "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD to run admin smoke.");

    await page.goto("/dang-nhap?next=/admin");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-form").getByRole("button", { name: /tiếp tục/i }).click();

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: /Quản trị/i })).toBeVisible();
  });
});
