import { expect, type Page } from "@playwright/test";

export async function createSmokeChart(page: Page, fullName = `Smoke Test ${Date.now()}`) {
  await page.goto("/");
  await expect(page.getByTestId("chart-form")).toBeVisible();

  await page.getByTestId("chart-full-name").fill(fullName);
  await page.getByTestId("chart-gender").selectOption("male");
  await page.getByTestId("chart-calendar-type").selectOption("solar");
  await page.getByTestId("chart-day").fill("7");
  await page.getByTestId("chart-month").fill("5");
  await page.getByTestId("chart-year").fill("1995");
  await page.getByTestId("chart-birth-hour").selectOption("4");
  await page.getByTestId("chart-view-year").fill("2026");
  await page.getByTestId("chart-form").getByRole("button").click();

  await expect(page).toHaveURL(/\/la-so\/[^/?#]+/);
  await expect(page.getByTestId("chart-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: fullName, exact: true })).toBeVisible();

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
