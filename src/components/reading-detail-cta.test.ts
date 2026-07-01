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
    expect(loaderSource).toContain("<ReadingDetailCta");
    expect(chartPageSource).toContain("<ReadingHashScrollRestorer");
  });

  it("keeps the existing premium confirmation form as the only paid action", () => {
    expect(premiumSource).toContain("premiumReadingModalId(props.chartId)");
    expect(premiumSource.match(/action=\{requestReadingAction\}/g)).toHaveLength(1);
  });
});
