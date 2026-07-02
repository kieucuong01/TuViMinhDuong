import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loginModalHref } from "@/components/login-modal-link";

const ctaUrl = new URL("./reading-detail-cta.tsx", import.meta.url);
const ctaPath = fileURLToPath(ctaUrl);
const loaderSource = readFileSync(fileURLToPath(new URL("./free-overview-loader.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const premiumSource = readFileSync(fileURLToPath(new URL("./premium-reading-cta.tsx", import.meta.url)), "utf8");

describe("reading detail CTA flow", () => {
  it("keeps the premium anchor in the modal login return URL", () => {
    const next = "/la-so/chart-1#mo-khoa-ho-so-vip";
    const href = loginModalHref("/la-so/chart-1", undefined, next);
    const params = new URL(href, "https://example.test").searchParams;

    expect(params.get("login")).toBe("1");
    expect(params.get("next")).toBe(next);
  });

  it("scrolls signed-in readers and restores the anchor after login", () => {
    expect(existsSync(ctaPath)).toBe(true);
    if (!existsSync(ctaPath)) return;
    const ctaSource = readFileSync(ctaPath, "utf8");

    expect(ctaSource).toContain("scrollToPremiumReading");
    expect(ctaSource).toContain("ReadingHashScrollRestorer");
    expect(ctaSource).toContain("window.location.hash");
    expect(ctaSource).toContain("loginModalHref");
    expect(ctaSource).toContain("onClick={() => scrollToPremiumReading()}");
    expect(chartPageSource).toContain("<ReadingHashScrollRestorer");
    expect(chartPageSource).toContain('style={{ scrollMarginTop: "7rem" }}');
  });

  it("keeps the premium target aligned while content above it finishes rendering", () => {
    expect(existsSync(ctaPath)).toBe(true);
    if (!existsSync(ctaPath)) return;
    const ctaSource = readFileSync(ctaPath, "utf8");

    expect(ctaSource).toContain("new ResizeObserver");
    expect(ctaSource).toContain("cancelRestoration");
    expect(ctaSource).toContain('"wheel"');
  });

  it("returns guests to the free reading before offering the premium dossier", () => {
    expect(loaderSource).toContain('const nextPath = `${chartPath}#luan-giai`');
    expect(loaderSource).toContain("loginModalHref(chartPath, undefined, nextPath)");
    expect(loaderSource).toContain("Đăng nhập miễn phí để xem toàn bộ luận giải");
    expect(loaderSource).toContain("Xem hồ sơ luận giải chuyên sâu");
  });

  it("keeps the existing premium confirmation form as the only paid action", () => {
    expect(premiumSource).toContain("premiumReadingModalId(props.chartId)");
    expect(premiumSource.match(/action=\{requestReadingAction\}/g)).toHaveLength(1);
  });
});
