import { expect, test } from "@playwright/test";
import { adminCredentials, createSmokeChart, loginAsAdmin } from "./helpers";

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
    await premiumCta.click();

    await expect(page.getByTestId("premium-reading-confirm-modal")).toBeVisible();
    await page.getByTestId("premium-reading-confirm-submit").click();

    await expect(page).toHaveURL(/\/dang-nhap\?/);
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("paywall-popup")).toBeVisible();
  });

  test("normal user without enough coins sees the coin topup modal", async ({ page }) => {
    await page.goto("/dang-nhap?next=/");
    await page.getByTestId("login-email").fill(`smoke-user-${Date.now()}@example.com`);
    await page.getByTestId("login-password").fill("Viplatui1");
    await page.getByTestId("login-form").locator("button[type=submit]").click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 });

    await createSmokeChart(page, `Coin Paywall ${Date.now()}`);

    const premiumCta = page.getByTestId("premium-reading-cta-bottom");
    await expect(premiumCta).toBeVisible();
    await premiumCta.click();

    await expect(page.getByTestId("premium-reading-confirm-modal")).toBeVisible();
    await page.getByTestId("premium-reading-confirm-submit").click();

    await expect(page).toHaveURL(/paywall=coins/);
    await expect(page.getByTestId("paywall-popup")).toBeVisible();
    await expect(page.getByTestId("coin-topup-modal")).toBeVisible();
  });

  test("date view updates date and birth year inputs", async ({ page }) => {
    await page.goto("/xem-ngay");
    await expect(page.getByTestId("date-view")).toBeVisible();

    const initialDate = await page.getByTestId("date-input").inputValue();
    await page.getByTestId("date-next-button").click();
    await page.getByTestId("birth-year-input").fill("1994");

    await expect(page.getByTestId("date-input")).not.toHaveValue(initialDate);
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

    await loginAsAdmin(page);
  });

  test("admin can unlock and view a full reading without buying coins", async ({ page }) => {
    const { email, password } = adminCredentials();
    test.skip(!email || !password, "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD to run admin smoke.");

    await loginAsAdmin(page);
    const { id } = await createSmokeChart(page, `Admin Full ${Date.now()}`);

    await page.getByTestId("premium-reading-cta-bottom").click();
    await expect(page.getByTestId("premium-reading-confirm-modal")).toBeVisible();
    await page.getByTestId("premium-reading-confirm-submit").click();

    await expect(page).toHaveURL(/reading=/, { timeout: 45_000 });
    await expect(page.getByTestId("free-reading-panel")).toBeVisible();

    await page.goto(`/la-so/${id}/nang-cao`);
    await expect(page.getByTestId("advanced-reading-page")).toBeVisible();
    await expect(page.getByTestId("advanced-reading-summary")).toBeVisible();
    await expect(page.getByTestId("advanced-reading-toc")).toBeVisible();
    await expect(page.getByTestId("advanced-reading-panel")).toBeVisible();
    await expect(page.getByTestId("advanced-reading-score")).toHaveCount(5);
    await expect(page.getByTestId("advanced-reading-chapter-list").getByText("Chương")).toHaveCount(8);
  });

  test("admin can create an article and the public page renders it", async ({ page }) => {
    const { email, password } = adminCredentials();
    test.skip(!email || !password, "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD to run admin smoke.");

    await loginAsAdmin(page);
    const suffix = Date.now();
    const title = `Smoke SEO Article ${suffix}`;
    const slug = `smoke-seo-article-${suffix}`;

    await page.getByTestId("admin-article-title").fill(title);
    await page.getByTestId("admin-article-slug").fill(slug);
    await page.getByTestId("admin-article-excerpt").fill("Bài smoke test kiểm tra luồng CMS và trang public đọc được sau khi admin lưu nội dung.");
    await page.getByTestId("admin-article-focus-keyword").fill("smoke tử vi");
    await page.getByTestId("admin-article-meta-title").fill(`${title} | Lá số tinh hoa`);
    await page.getByTestId("admin-article-meta-description").fill("Smoke test cho CMS Lá số tinh hoa, đảm bảo bài viết public render sau khi lưu từ admin.");
    await page.getByTestId("admin-article-canonical").fill(`/kien-thuc-tu-vi/${slug}`);
    await page.getByTestId("admin-article-cover-image").fill("/articles/la-so-12-cung.svg");
    await page.getByTestId("admin-article-cover-alt").fill("Minh họa lá số tử vi cho bài smoke test");
    await page.getByTestId("admin-article-content").fill(`# ${title}

Đây là bài viết smoke test dùng để kiểm tra CMS hoạt động ổn định.

## Vì sao cần smoke test CMS

Admin cần lưu được bài viết, chấm SEO cơ bản và xuất bản ra trang kiến thức tử vi.

## Liên kết nội bộ

Người đọc có thể quay về [lập lá số miễn phí](/#lap-la-so) hoặc xem thêm mục [xem ngày](/xem-ngay).`);
    await page.getByTestId("admin-article-submit").click();

    await expect(page).toHaveURL(new RegExp(`\\/admin\\?saved=${slug}`));
    await page.goto(`/kien-thuc-tu-vi/${slug}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Vì sao cần smoke test CMS")).toBeVisible();
    await expect(page.locator("#article-jsonld")).toHaveCount(1);
  });
});
