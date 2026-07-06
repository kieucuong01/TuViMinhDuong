import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");

describe("FreeOverviewLoader LLM-only flow", () => {
  it("shows generation status while starting the background overview process without rendering fallback copy", () => {
    expect(loaderSource).toContain('status: "fallback"');
    expect(loaderSource).toContain("/free-overview/process");
    expect(loaderSource).toContain("schedulePoll()");
    expect(loaderSource).toContain("free-overview-inline-status");
    expect(loaderSource).toContain('state.status === "fallback"');
    expect(loaderSource).not.toContain("instantOverviewContent");
  });

  it("reveals an LLM preview progressively and keeps polling for the full report", () => {
    expect(loaderSource).toContain('status: "preview"');
    expect(loaderSource).toContain("free-overview-writing-cursor");
    expect(loaderSource).toContain("setVisiblePreviewWords");
    expect(loaderSource).toContain("schedulePoll()");
    expect(globalsCss).toContain("@keyframes free-overview-cursor");
    expect(globalsCss).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps the login CTA visible for guests while waiting, previewing, or handling an error", () => {
    expect(loaderSource).toContain("function GuestOverviewLoginCta");
    expect(loaderSource).toContain("Đăng nhập miễn phí để xem chi tiết");
    expect(loaderSource).toContain("Đang đọc những tín hiệu nổi bật trong lá số");
    expect(loaderSource.match(/<GuestOverviewLoginCta/g)?.length).toBeGreaterThanOrEqual(3);
    expect(loaderSource).toContain("#luan-giai");
  });

  it("does not pass server-generated template copy into the free overview UI", () => {
    expect(loaderSource).toContain("initialOverview");
    expect(loaderSource).toContain("useState<FreeOverviewState>(() =>");
    expect(chartPageSource).toContain("getFreeOverviewStatus(record.chart)");
    expect(chartPageSource).toContain("initialOverview={visibleFreeOverviewStatus}");
    expect(chartPageSource).not.toContain("buildInstantFreeOverview");
    expect(chartPageSource).not.toContain("instantOverviewContent=");
    expect(chartPageSource).not.toContain("deferUntilVisible");
  });

  it("projects only ready LLM guest content before it reaches the page HTML", () => {
    expect(chartPageSource).toContain('import { buildFreeOverviewTeaser } from "@/lib/free-overview-presentation"');
    expect(chartPageSource).toContain('freeOverviewStatus?.status === "ready"');
    expect(chartPageSource).toContain("buildFreeOverviewTeaser(freeOverviewStatus.content)");
  });

  it("polls with no-store and refreshes the route when the full overview is ready", () => {
    expect(loaderSource).toContain('import { useRouter } from "next/navigation"');
    expect(loaderSource).toContain("router.refresh()");
    expect(loaderSource).toContain('cache: "no-store"');
    expect(loaderSource).toContain("MAX_POLL_ATTEMPTS = 72");
  });

  it("renders only the ready LLM overview once available", () => {
    expect(loaderSource).toContain("function hideFreeOverviewTemplateHeading(content: string)");
    expect(loaderSource).toContain("Tổng quan miễn phí");
    expect(loaderSource).toContain('if (state.status === "ready")');
    expect(loaderSource).toContain("const expandedOverviewContent = hideFreeOverviewTemplateHeading(state.detailContent)");
    expect(loaderSource).not.toContain("{!hasExpandedOverview ? <MarkdownContent content={state.content} /> : null}");
    expect(loaderSource).toContain("<MarkdownContent content={expandedOverviewContent} />");
  });

  it("lets readers retry failed or stale background overview jobs without reloading", () => {
    expect(loaderSource).toContain("retryOverview");
    expect(loaderSource).toContain("Thử viết lại");
    expect(loaderSource).toContain('state.jobStatus === "stale"');
    expect(loaderSource).toContain('state.jobStatus === "failed"');
  });

  it("has inline status styling for the fast overview state", () => {
    expect(globalsCss).toContain(".free-overview-inline-status");
  });

  it("shows guests a locked preview and preserves the chart through login", () => {
    expect(loaderSource).toContain('import Link from "next/link"');
    expect(loaderSource).toContain('import { loginModalHref } from "@/components/login-modal-link"');
    expect(loaderSource).toContain("Đăng nhập miễn phí để xem toàn bộ luận giải");
    expect(loaderSource).toContain("Lá số này sẽ được giữ nguyên");
    expect(loaderSource).toContain("free-overview-locked-sections");
    expect(loaderSource).toContain("Khí chất và nội lực");
    expect(loaderSource).toContain("Công việc và tài chính");
    expect(loaderSource).toContain("Tình cảm và quan hệ");
    expect(loaderSource).toContain("Vận năm và cẩm nang hành động");
    expect(loaderSource).toContain("#luan-giai");
    expect(globalsCss).toContain(".free-overview-guest-gate");
    expect(globalsCss).toContain(".free-overview-locked-row");
    expect(globalsCss).toContain(".free-overview-login-copy");
  });

  it("offers the VIP dossier only after the signed-in free report", () => {
    expect(loaderSource).toContain("free-overview-vip-transition");
    expect(loaderSource).toContain('import { premiumReadingModalId } from "@/components/premium-reading-target"');
    expect(loaderSource).toContain("popoverTarget={premiumReadingModalId(chartId)}");
    expect(loaderSource).not.toContain("<ReadingDetailCta");
    expect(loaderSource).toContain("Xem hồ sơ luận giải chuyên sâu");
    expect(globalsCss).toContain(".free-overview-vip-transition");
  });
});
