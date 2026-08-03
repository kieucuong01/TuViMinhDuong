import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";

const viewSource = readFileSync(fileURLToPath(new URL("./wealth-fortune-view.tsx", import.meta.url)), "utf8");
const wealthStyles = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("WealthFortuneView", () => {
  it("keeps the wealth report server-rendered and accessible", () => {
    expect(viewSource).not.toContain('"use client"');
    expect(viewSource).toContain("buildWealthFortuneReport");
    expect(viewSource).toContain('role="img"');
    expect(viewSource).toContain("<table");
    expect(viewSource).toContain("Chỉ số định hướng");
    expect(viewSource).toContain("không thay thế tư vấn tài chính");
  });

  it("renders a titled trend graphic and five-row table fallback", async () => {
    const { WealthFortuneView } = await import("./wealth-fortune-view");
    const chart = generateTuViChart(CHART_FIXTURES[0].input);

    const html = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-1", chart }));

    expect(html).toContain('role="img"');
    expect(html).toContain("Chỉ số định hướng");
    expect(html).toContain("Bảng chỉ số định hướng 5 năm");
    expect((html.match(/<tr/g) ?? []).length).toBe(6);
    expect(html).toContain("không thay thế tư vấn tài chính");
  });

  it("labels every pillar score as a directional indicator", async () => {
    const { WealthFortuneView } = await import("./wealth-fortune-view");
    const chart = generateTuViChart(CHART_FIXTURES[0].input);

    const html = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-1", chart }));

    expect((html.match(/class="wealth-pillar-score-label">Chỉ số định hướng/g) ?? [])).toHaveLength(4);
    expect(["Dòng tiền", "Năng lực tạo giá trị", "Mở rộng môi trường", "Nền tích lũy"]
      .every((label) => html.includes(`<h2>${label}</h2>`))).toBe(true);
  });

  it("renders the composite posture and the strongest and caution years", async () => {
    const { WealthFortuneView } = await import("./wealth-fortune-view");
    const chart = generateTuViChart(CHART_FIXTURES[0].input);

    const html = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-1", chart }));

    expect(html).toContain('class="wealth-overall-label">Chỉ số định hướng tổng hợp</span>');
    expect(html).toMatch(/aria-label="Chỉ số định hướng tổng hợp \d+ trên 100,/);
    expect(html).not.toContain("Chỉ số tổng hợp");
    expect([
      "Tăng trưởng từ nghề",
      "Quản trị dòng tiền",
      "Mở rộng có kiểm chứng",
      "Tích lũy bền",
      "Phòng thủ và sửa nền",
    ].some((label) => html.includes(label))).toBe(true);
    expect(html).toContain("Năm thuận hơn để kiểm chứng");
    expect(html).toContain("Năm cần kiểm chứng nhiều hơn");
    expect(html).toContain(`Bản đồ Tài - Quan - Di của ${chart.input.fullName} · ${chart.input.viewYear}`);
  });

  it("links the evidence cards to the three public deep-reading routes", async () => {
    const { WealthFortuneView } = await import("./wealth-fortune-view");
    const chart = generateTuViChart(CHART_FIXTURES[0].input);

    const html = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-1", chart }));

    expect(html).toContain('href="/tra-cuu/cung-tai-bach"');
    expect(html).toContain('href="/tra-cuu/cung-quan-loc"');
    expect(html).toContain('href="/tra-cuu/cung-thien-di"');
  });

  it("renders the 90-day plan and all six pre-decision questions", async () => {
    const { WealthFortuneView } = await import("./wealth-fortune-view");
    const chart = generateTuViChart(CHART_FIXTURES[0].input);

    const html = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-1", chart }));

    expect(html).toContain("Kế hoạch hành động 90 ngày");
    expect(html).toContain("30 ngày — Sửa trụ yếu");
    expect(html).toContain("60 ngày — Dùng trụ mạnh");
    expect(html).toContain("90 ngày — Đặt cổng kiểm chứng");
    expect(html).toContain("Bộ lọc 6 câu trước quyết định lớn");
    expect((html.match(/class="wealth-decision-question"/g) ?? [])).toHaveLength(6);
  });

  it("renders distinct neutral and unavailable evidence fallbacks", async () => {
    const { WealthFortuneView } = await import("./wealth-fortune-view");
    const chart = generateTuViChart(CHART_FIXTURES[0].input);
    const chartWithEmptyRecognizedCategories = {
      ...chart,
      palaces: chart.palaces.map((palace) => palace.name === "Tài Bạch" ? {
        ...palace,
        supportStars: [],
        yearlyStars: [],
      } : palace),
    };
    const chartWithoutTaiBach = {
      ...chart,
      palaces: chart.palaces.filter((palace) => palace.name !== "Tài Bạch"),
    };

    const neutralHtml = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-neutral", chart: chartWithEmptyRecognizedCategories }));
    const unavailableHtml = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-unavailable", chart: chartWithoutTaiBach }));

    expect(neutralHtml).toContain("Sao hỗ trợ:</strong> Không ghi nhận sao hỗ trợ trong nhóm theo dõi");
    expect(neutralHtml).toContain("Điểm cần lưu ý:</strong> Không ghi nhận điểm cần lưu ý trong nhóm theo dõi");
    expect(unavailableHtml).toContain("Sao hỗ trợ:</strong> Chưa có dữ liệu");
    expect(unavailableHtml).toContain("Điểm cần lưu ý:</strong> Chưa có dữ liệu");
  });

  it("keeps mobile report explanations and safety text at 16px or larger", () => {
    expect(wealthStyles).toMatch(/\.wealth-pillar-card p,[\s\S]*?\.wealth-action-list p \{[^}]*font-size: 1rem;/);
    expect(wealthStyles).toMatch(/\.wealth-trend-figure figcaption \{[^}]*font-size: 1rem;/);
    expect(wealthStyles).toMatch(/\.wealth-trend-table \{[^}]*font-size: 1rem;/);
    expect(wealthStyles).toMatch(/\.wealth-disclaimer \{[^}]*font-size: 1rem;/);
    expect(wealthStyles).toMatch(/\.wealth-decision-list \{[^}]*font-size: 1rem;/);
  });

  it("scales SVG score and year labels for a readable mobile rendered size", () => {
    expect(wealthStyles).toMatch(/@media \(max-width: 520px\) \{[\s\S]*?\.wealth-trend-score,[\s\S]*?\.wealth-trend-year \{[^}]*font-size: 28px;/);
  });
});
