import { expect, type Page } from "@playwright/test";

export async function createSmokeChart(page: Page, fullName = `Smoke Test ${Date.now()}`) {
  await page.goto("/");
  await expect(page.getByTestId("chart-form")).toBeVisible();

  await page.getByTestId("chart-full-name").fill(fullName);
  await page.getByTestId("chart-gender").selectOption("male");
  await page.getByTestId("chart-calendar-type").selectOption("solar");
  await page.getByTestId("chart-day").selectOption("7");
  await page.getByTestId("chart-month").selectOption("5");
  await page.getByTestId("chart-year").selectOption("1995");
  await page.getByTestId("chart-birth-hour").selectOption("4");
  await page.getByTestId("chart-view-year").selectOption("2026");
  await page.getByTestId("chart-form").locator("button[type=submit]").click();

  await expect(page).toHaveURL(/\/la-so\/[^/?#]+/, { timeout: 45_000 });
  await expect(page.getByTestId("chart-page")).toBeVisible();
  await expect(page.getByTestId("chart-page").getByText(fullName).first()).toBeVisible();

  const id = new URL(page.url()).pathname.split("/").pop();
  if (!id) throw new Error("Chart id was not present in URL.");
  return { id, fullName };
}

export function adminCredentials() {
  return {
    email: process.env.PLAYWRIGHT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "",
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "",
  };
}

export async function loginAsAdmin(page: Page) {
  const { email, password } = adminCredentials();
  if (!email || !password) return false;

  await page.goto("/dang-nhap?next=/admin");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-form").locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByTestId("admin-page")).toBeVisible();
  return true;
}
