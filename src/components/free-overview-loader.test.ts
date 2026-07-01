import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");

describe("FreeOverviewLoader fast-first flow", () => {
  it("renders fallback content while starting the background overview process", () => {
    expect(loaderSource).toContain('status: "fallback"');
    expect(loaderSource).toContain("/free-overview/process");
    expect(loaderSource).toContain("schedulePoll()");
    expect(loaderSource).toContain("free-overview-inline-status");
  });

  it("renders server-provided instant overview content before client polling finishes", () => {
    expect(loaderSource).toContain("initialOverview");
    expect(loaderSource).toContain("useState<FreeOverviewState>(() =>");
    expect(chartPageSource).toContain("getFreeOverviewStatus(record.chart)");
    expect(chartPageSource).toContain("initialOverview={visibleFreeOverviewStatus}");
    expect(chartPageSource).not.toContain("deferUntilVisible");
  });

  it("projects guest content before it reaches the page HTML", () => {
    expect(chartPageSource).toContain('import { buildFreeOverviewTeaser } from "@/lib/free-overview-presentation"');
    expect(chartPageSource).toContain("!user && freeOverviewStatus?.content");
    expect(chartPageSource).toContain("buildFreeOverviewTeaser(freeOverviewStatus.content)");
    expect(chartPageSource).toContain("buildFreeOverviewTeaser(instantFreeOverviewContent)");
  });

  it("polls with no-store and refreshes the route when the full overview is ready", () => {
    expect(loaderSource).toContain('import { useRouter } from "next/navigation"');
    expect(loaderSource).toContain("router.refresh()");
    expect(loaderSource).toContain('cache: "no-store"');
    expect(loaderSource).toContain("MAX_POLL_ATTEMPTS = 72");
  });

  it("hides the instant free template once the expanded LLM overview is ready", () => {
    expect(loaderSource).toContain("function hideFreeOverviewTemplateHeading(content: string)");
    expect(loaderSource).toContain("Tổng quan miễn phí");
    expect(loaderSource).toContain("const hasExpandedOverview = state.status === \"ready\" && state.detailContent !== state.content");
    expect(loaderSource).toContain("const expandedOverviewContent = hasExpandedOverview ? hideFreeOverviewTemplateHeading(state.detailContent) : \"\"");
    expect(loaderSource).toContain("{!hasExpandedOverview ? <MarkdownContent content={state.content} /> : null}");
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
    expect(loaderSource).toContain("Xem hồ sơ luận giải chuyên sâu");
    expect(globalsCss).toContain(".free-overview-vip-transition");
  });
});
