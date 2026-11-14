import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FreeOverviewLoader } from "@/components/free-overview-loader";
import { parseFreeOverviewSections } from "@/components/free-overview-reading-experience";

const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const refreshSource = readFileSync(fileURLToPath(new URL("./free-overview-refresh-trigger.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const normalizedChartPageSource = chartPageSource.replace(/\s+/g, " ");
const overview = { status: "ready" as const, source: "llm" as const, content: "## 1. Khí chất\n\nNội dung đã chiếu từ server." };
const structuredOverview = {
  status: "ready" as const,
  source: "llm" as const,
  content: `# Luận giải miễn phí

## 1. Năng lực thiên phú (Cung Mệnh)

[Block Nội dung - Tử Vi]:

Mệnh sáng và biết dung hòa.

**Lợi thế nổi bật:** Bạn nhìn được nhiều góc độ trước khi quyết định.

Để tự đối chiếu, hãy nhìn lại ba việc gần đây bạn làm tốt nhất và việc nào khiến bạn phải gồng quá lâu.

**Điểm dễ vướng:** Dễ cân nhắc quá lâu.

🔒 Nâng cấp Premium để xem:
- Điểm mạnh nào tạo lợi thế rõ nhất.

## 2. Phong cách kiếm tiền (Cung Tài Bạch)

Bạn tạo giá trị nhờ chuyên môn.

**Lợi thế nổi bật:** Thu nhập bền khi làm việc có hệ thống.

🔒 Nâng cấp Premium để xem:
- Dòng tiền 12 tháng.

## 3. Môi trường làm việc lý tưởng (Cung Quan Lộc)

Bạn hợp môi trường có quyền chủ động.

**Lợi thế nổi bật:** Có khả năng dẫn dắt nhóm nhỏ.

🔒 Nâng cấp Premium để xem:
- Thời điểm phát triển công việc.

## 4. Vận hạn năm 2026 (Năm Bính Ngọ)

Đây là năm cần tái cấu trúc.

**Lợi thế nổi bật:** Cơ hội rõ hơn vào nửa cuối năm.

🔒 Nâng cấp Premium để xem:
- Lộ trình vận hạn 12 tháng.`,
};

describe("FreeOverviewLoader seed-first LLM refresh gate", () => {
  it("separates evidence and the self-check without repeating them in the narrative", () => {
    const content = `## 1. Năng lực thiên phú (Cung Mệnh)

Bạn thường cân nhắc trước khi nhận thêm việc.

Căn cứ từ lá số: Cung Mệnh tại Tý có Thiên Cơ.

Để tự đối chiếu: Bạn còn thiếu thông tin gì để chốt?

Hãy viết một việc có thể thử ngay.

🔒 Nâng cấp Premium để xem:
- Cách ra quyết định của bạn khi đối chiếu thêm cung Thân.`;
    const [section] = parseFreeOverviewSections(content);
    expect(section.evidence).toBe("Cung Mệnh tại Tý có Thiên Cơ.");
    expect(section.selfCheck).toContain("Bạn còn thiếu thông tin gì để chốt?");
    expect(section.body).not.toContain("Căn cứ");
    expect(section.body).not.toContain("Để tự đối chiếu");
    expect(section.body).toContain("Hãy viết một việc có thể thử ngay.");
    expect(section.premiumPreview).not.toContain("Căn cứ từ lá số");
  });

  it("renders seed content immediately and keeps the background LLM refresh non-blocking", () => {
    expect(loaderSource).toContain('const isLlmReady = initialOverview.source === "llm"');
    expect(loaderSource).toContain("Đang bổ sung lời giải thích cho từng phần");
    expect(loaderSource).toContain("<FreeOverviewReadingExperience");
    expect(loaderSource).not.toContain("FreeOverviewTypingReveal");
    expect(loaderSource).toContain("FreeOverviewRefreshTrigger");
    expect(loaderSource).not.toContain("useEffect");
    expect(loaderSource).not.toContain("fetch(");
    expect(refreshSource).toContain("\"use client\"");
    expect(refreshSource).toContain("/free-overview/process");
    expect(refreshSource).toContain("void pollUntilReady();");
    expect(refreshSource).toContain("router.refresh()");
    expect(refreshSource).toContain("attempt >= 45");
  });

  it("offers one topic list, four readable sections and links back to the chart", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: structuredOverview,
        isSignedIn: false,
        canReadFullOverview: false,
        canCheckoutFull: true,
        priceCoins: 199,
      }),
    );

    expect(html).toContain("Luận giải của Nguyễn Minh Anh");
    expect(html).toContain("Bản chuyên sâu giúp bạn xem thêm điều gì?");
    expect(html).toContain('id="free-insight-2"');
    expect(html).toContain("Bản thân");
    expect(html).toContain("Tiền bạc");
    expect(html).toContain("Sự nghiệp và công danh");
    expect(html).not.toContain("Lợi thế nổi bật");
    expect(html).toContain('aria-label="Điều hướng luận giải miễn phí"');
    expect(html).toContain('href="#free-insight-1"');
    expect(html.match(/data-reading-section=/gu)).toHaveLength(4);
    expect(html).toContain('href="#chu-de-luan-giai"');
    expect(html).toContain('href="#chart-palaces"');
    expect(html).toContain('data-ad-view="free_overview_section_viewed"');
    expect(html).not.toContain("[Block Nội dung");
    expect(html).not.toContain('href="#personal-report-outline"');
    expect(html).toContain("Xem bản chuyên sâu — 199.000đ");
    expect(html).toContain('data-ad-click="full_offer_bottom_clicked"');
    expect(html).not.toContain("free-overview-typing-cursor");
  });

  it("keeps insight three and four server-side for guests and signed-in non-owners", () => {
    expect(normalizedChartPageSource).toContain(
      'const canReadFullOverview = Boolean(user && (user.role === "ADMIN" || record.userId === user.id));',
    );
    expect(chartPageSource).toContain("buildFreeOverviewTeaser");
    expect(chartPageSource).toContain("buildFreeOverviewTeaser(freeOverviewStatus.content)");
    expect(chartPageSource).toContain("!canReadFullOverview && freeOverviewStatus");
    expect(chartPageSource).toContain("initialOverview={visibleFreeOverviewStatus}");
    expect(chartPageSource).toContain("fullName={record.chart.input.fullName}");
    expect(chartPageSource).toContain("canReadFullOverview={canReadFullOverview}");
    expect(chartPageSource).toContain("isSignedIn={Boolean(user)}");
    expect(chartPageSource).toContain("canCheckoutFull={canCheckoutFull}");
    expect(chartPageSource).toContain("priceCoins={featurePrices?.FULL.priceCoins ?? 199}");
    expect(chartPageSource).toContain("canReadFullOverview && featurePrices ? <ReadingTabs");
    expect(chartPageSource).toContain("canCheckoutFull && featurePrices ? <PremiumReadingCta");
    expect(loaderSource).not.toContain("detailContent");
    expect(loaderSource).not.toContain("expandedOverviewContent");
  });

  it("keeps all four free sections visible and offers login only to save the chart", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: structuredOverview,
        isSignedIn: false,
        canReadFullOverview: false,
        canCheckoutFull: false,
      }),
    );

    expect(html).toContain("Đăng nhập để lưu lá số của Nguyễn Minh Anh");
    expect(html).toContain("Đăng nhập để lưu lá số");
    expect(html).toContain("Bạn có thể dùng email hoặc Google.");
    expect(html).toContain('data-ad-view="free_overview_viewed"');
    expect(html).toContain('data-ad-depth="4"');
    expect(html).not.toContain("2/4 phần");
    expect(html).not.toContain("free-overview-locked-sections");
    expect(html).toContain("%23luan-giai");
    expect(html).toContain('data-ad-click="login_gate_clicked"');
    expect(loaderSource).toContain("data-ad-view=\"login_gate_viewed\"");
    expect(html).toContain("login=1");
  });

  it("opens the premium popover for a guest without changing the free login gate", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: structuredOverview,
        isSignedIn: false,
        canReadFullOverview: false,
        canCheckoutFull: true,
        priceCoins: 199,
      }),
    );

    expect(html).toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).not.toContain("/dang-nhap");
    expect(html).not.toContain("login=1");
  });

  it("does not render a dead premium trigger for a guest viewing an owned chart", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: structuredOverview,
        isSignedIn: false,
        canReadFullOverview: false,
        canCheckoutFull: false,
        priceCoins: 199,
      }),
    );

    expect(html).not.toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).toContain("Đăng nhập để lưu lá số");
  });

  it("shows all four projected sections to an owner without a gate", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: structuredOverview,
        isSignedIn: true,
        canReadFullOverview: true,
        canCheckoutFull: true,
        priceCoins: 199,
      }),
    );

    expect(html).toContain('data-ad-depth="4"');
    expect(html).toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).not.toContain("không cần đăng nhập trước");
    expect(html).not.toContain("login_gate_clicked");
    expect(html).not.toContain("/lap-la-so");
  });

  it("does not keep the AI loading handoff visible after generation fails", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: {
          status: "fallback",
          source: "seed-rules",
          jobStatus: "failed",
          content: "## 1. Khí chất\n\nBản seed vẫn đọc được.",
        },
        isSignedIn: true,
        canReadFullOverview: true,
        canCheckoutFull: true,
      }),
    );

    expect(html).toContain("Bản seed vẫn đọc được.");
    expect(html).not.toContain("Đang viết tiếp bản luận giải AI cá nhân hóa");
  });

  it("keeps a signed-in non-owner at 2/4 with a safe recovery path", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: overview,
        isSignedIn: true,
        canReadFullOverview: false,
        canCheckoutFull: false,
      }),
    );

    expect(html).toContain('data-ad-depth="2"');
    expect(html).toContain("Lá số này không thuộc tài khoản của bạn");
    expect(html).toContain('href="/lap-la-so"');
    expect(html).not.toContain("login_gate_clicked");
  });

  it("binds a selected reading to the current chart", () => {
    expect(normalizedChartPageSource).toContain(
      "const selectedReading = selectedReadingCandidate?.chartId === id ? selectedReadingCandidate : null;",
    );
  });
});
