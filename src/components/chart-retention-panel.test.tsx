import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChartRetentionPanel } from "@/components/chart-retention-panel";

const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const globalsSource = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("ChartRetentionPanel", () => {
  it("offers guests one clear way to save the chart after seeing the result", () => {
    const markup = renderToStaticMarkup(
      <ChartRetentionPanel chartId="chart-1" isSignedIn={false} canCheckoutFull hasAdvancedReading={false} />,
    );
    expect(markup).toContain("Giữ lại lá số này để xem tiếp khi cần");
    expect(markup).toContain("Đăng nhập để lưu lá số");
    expect(markup).toContain("login=1");
    expect(markup).toContain('data-ad-click="login_gate_clicked"');
    expect(markup.match(/class="btn btn-primary/g)).toHaveLength(1);
  });

  it("lets a paid owner resume the completed reading", () => {
    const markup = renderToStaticMarkup(
      <ChartRetentionPanel chartId="chart-1" isSignedIn canCheckoutFull hasAdvancedReading advancedReadingId="reading-1" />,
    );
    expect(markup).toContain("Tiếp tục đọc bản luận giải");
    expect(markup).toContain("/la-so/chart-1/nang-cao?reading=reading-1");
    expect(markup).not.toContain("Mở bản luận giải chuyên sâu");
  });

  it("opens the existing full-reading offer for a signed-in owner without a paid reading", () => {
    const markup = renderToStaticMarkup(
      <ChartRetentionPanel chartId="chart-1" isSignedIn canCheckoutFull hasAdvancedReading={false} />,
    );
    expect(markup).toContain("Mở bản luận giải chuyên sâu");
    expect(markup).toContain('popoverTarget="premium-confirm-chart-1"');
    expect(markup).toContain('data-ad-click="full_offer_clicked"');
  });

  it("appears only after the useful reading result and before the detailed paid outline", () => {
    expect(chartPageSource.indexOf('className="panel reading-content-panel')).toBeLessThan(chartPageSource.indexOf("<ChartRetentionPanel"));
    expect(chartPageSource.indexOf("<ChartRetentionPanel")).toBeLessThan(chartPageSource.indexOf("<PersonalizedReportOutline"));
    expect(chartPageSource).toContain("advancedReadingId={viewerFullReading?.id}");
    expect(chartPageSource).toContain("canCheckoutFull={canCheckoutFull}");
  });

  it("has a responsive visual treatment", () => {
    expect(globalsSource).toContain(".chart-retention-panel");
    expect(globalsSource).toContain(".chart-retention-action");
    expect(globalsSource).toContain(".chart-retention-copy");
  });
});
