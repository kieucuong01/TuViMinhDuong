import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FreeOverviewLoader } from "@/components/free-overview-loader";

const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const refreshSource = readFileSync(fileURLToPath(new URL("./free-overview-refresh-trigger.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const normalizedChartPageSource = chartPageSource.replace(/\s+/g, " ");
const overview = { status: "ready" as const, source: "llm" as const, content: "## 1. Khí chất\n\nNội dung đã chiếu từ server." };

describe("FreeOverviewLoader LLM-only gate", () => {
  it("renders only LLM content and uses a tiny client trigger while the LLM is not ready", () => {
    expect(loaderSource).toContain('initialOverview?.source === "llm"');
    expect(loaderSource).toContain("Đang viết bản luận giải tổng quan bằng AI");
    expect(loaderSource).toContain("<MarkdownContent content={overviewContent} />");
    expect(loaderSource).toContain("FreeOverviewRefreshTrigger");
    expect(loaderSource).not.toContain("shouldRefreshOverview");
    expect(loaderSource).not.toContain("useEffect");
    expect(loaderSource).not.toContain("fetch(");
    expect(refreshSource).toContain("\"use client\"");
    expect(refreshSource).toContain("/free-overview/process");
    expect(refreshSource).toContain("router.refresh()");
    expect(refreshSource).toContain("attempt >= 30");
    expect(loaderSource).not.toContain("schedulePoll");
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
    expect(chartPageSource).toContain("canReadFullOverview && featurePrices ? <ReadingTabs");
    expect(chartPageSource).toContain("canReadFullOverview && featurePrices ? <PremiumReadingCta");
    expect(loaderSource).not.toContain("detailContent");
    expect(loaderSource).not.toContain("expandedOverviewContent");
  });

  it("uses the approved login gate copy and tracks the 2/4 funnel depth", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: overview,
        isSignedIn: false,
        canReadFullOverview: false,
      }),
    );

    expect(html).toContain("Lưu lá số của Nguyễn Minh Anh để đọc tiếp miễn phí");
    expect(html).toContain("Lưu lá số &amp; đọc tiếp miễn phí");
    expect(html).toContain("Email mới tự tạo tài khoản • Tặng 30 xu • Có thể dùng Google • Chưa mất phí");
    expect(html).toContain('data-ad-view="free_overview_viewed"');
    expect(html).toContain('data-ad-depth="2"');
    expect(html).toContain("%23luan-giai");
    expect(html).toContain('data-ad-click="login_gate_clicked"');
    expect(loaderSource).toContain("data-ad-view=\"login_gate_viewed\"");
  });

  it("shows all four projected sections to an owner without a gate", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: overview,
        isSignedIn: true,
        canReadFullOverview: true,
      }),
    );

    expect(html).toContain('data-ad-depth="4"');
    expect(html).not.toContain("login_gate_clicked");
    expect(html).not.toContain("/lap-la-so");
  });

  it("keeps a signed-in non-owner at 2/4 with a safe recovery path", () => {
    const html = renderToStaticMarkup(
      createElement(FreeOverviewLoader, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        initialOverview: overview,
        isSignedIn: true,
        canReadFullOverview: false,
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
