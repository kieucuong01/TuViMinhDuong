import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildTrafficAutopilotPlan,
  buildMarketingFrameworks,
  buildShortVideoPack,
  buildSocialDistribution,
  createTrafficReport,
  pickTrafficArticle,
} from "../../scripts/traffic/traffic-autopilot.mjs";

describe("Traffic Autopilot", () => {
  const existingSlugs = ["la-so-tu-vi-la-gi", "tao-la-so-tu-vi", "cach-doc-la-so-tu-vi-cho-nguoi-moi"];
  const tempDirs = [];

  afterEach(() => {
    while (tempDirs.length) {
      rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  it("uses SEO publisher days as follow-up days instead of rerunning the publisher", () => {
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-08T14:30:00.000Z"),
    });

    expect(plan.mode).toBe("seo-publisher-followup");
    expect(plan.primaryTask).toContain("Theo doi");
    expect(plan.commands).not.toContain("npm run seo:autopilot:publisher");
    expect(plan.dailyWorkLimit.maxPrimaryTasks).toBe(1);
  });

  it("creates safe short-video follow-up tasks after the daily publisher", () => {
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-09T14:30:00.000Z"),
    });

    expect(plan.mode).toBe("seo-publisher-followup");
    expect(plan.primaryTask).toContain("publisher 21:00");
    expect(plan.socialDistribution).toHaveLength(4);
    expect(plan.socialDistribution.map((item) => item.channel)).toEqual([
      "tiktok-short",
      "youtube-shorts",
      "facebook-reels",
      "website-cta-flow",
    ]);
    expect(plan.socialDistribution.map((item) => item.link).join(" ")).toContain(
      "/kien-thuc-tu-vi/tao-la-so-tu-vi",
    );
    expect(plan.shortVideoPack.platformCaptions.tiktok).toContain("utm_source=tiktok");
    expect(plan.commands).toEqual(["npm run traffic:autopilot"]);
  });

  it("keeps paid ads and direct posting behind explicit approval", () => {
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-10T14:30:00.000Z"),
    });

    expect(plan.hardStops.join(" ")).toContain("Khong tu dong dang bai");
    expect(plan.hardStops.join(" ")).toContain("ads de phase sau");
  });

  it("uses Sunday as publisher follow-up because weekly strategy now runs before publishing", () => {
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-14T14:30:00.000Z"),
    });

    expect(plan.weekday).toBe("Sun");
    expect(plan.mode).toBe("seo-publisher-followup");
    expect(plan.primaryTask).toContain("TikTok/YouTube Shorts/Facebook Reels");
  });

  it("imports the relevant marketingskills frameworks into the daily plan", () => {
    const frameworks = buildMarketingFrameworks({ hasProductMarketingContext: true });
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-11T14:30:00.000Z"),
    });

    expect(frameworks.source).toBe("coreyhaines31/marketingskills");
    expect(frameworks.context.path).toBe(".agents/product-marketing.md");
    expect(frameworks.installedSkills).toEqual(
      expect.arrayContaining(["product-marketing", "content-strategy", "social", "free-tools", "cro", "analytics"]),
    );
    expect(plan.marketingFrameworks.appliedPrinciples.join(" ")).toContain("Content strategy");
    expect(plan.marketingFrameworks.appliedPrinciples.join(" ")).toContain("TikTok");
  });

  it("builds platform-specific short-video snippets with chart creation as the compact CTA", () => {
    const article = pickTrafficArticle({ existingSlugs, preferredSlug: "tao-la-so-tu-vi" });
    const shortVideoPack = buildShortVideoPack({ article });
    const distribution = buildSocialDistribution({ article });
    const combinedCopy = distribution
      .flatMap((item) => [item.copy, ...(item.script || [])])
      .join(" ");

    expect(article.url).toBe("/kien-thuc-tu-vi/tao-la-so-tu-vi");
    expect(shortVideoPack.phase).toBe("organic-short-video");
    expect(shortVideoPack.platformCaptions.youtubeShorts).toContain("utm_source=youtube_shorts");
    expect(shortVideoPack.platformCaptions.facebookReels).toContain("utm_source=facebook_reels");
    expect(combinedCopy).toContain("/#lap-la-so");
    expect(combinedCopy).not.toMatch(/chac chan|bao dam|doi doi/i);
  });

  it("uses the latest SEO publisher state action before static fallback articles", () => {
    const article = pickTrafficArticle({
      existingSlugs: [...existingSlugs, "phan-tich-la-so-tu-vi"],
      seoState: {
        lastAction: {
          slug: "phan-tich-la-so-tu-vi",
        },
      },
    });

    expect(article.slug).toBe("phan-tich-la-so-tu-vi");
    expect(article.url).toBe("/kien-thuc-tu-vi/phan-tich-la-so-tu-vi");
  });

  it("writes a durable short-video report with captions, UTM links, and website CTA", () => {
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-12T07:23:15.723Z"),
    });
    const tempDir = mkdtempSync(join(tmpdir(), "traffic-autopilot-"));
    tempDirs.push(tempDir);
    const reportPath = createTrafficReport({ plan, reportsDir: tempDir });
    const report = readFileSync(reportPath, "utf8");

    expect(reportPath).toContain("2026-06-12-tao-la-so-tu-vi.md");
    expect(report).toContain("# Traffic Autopilot Report");
    expect(report).toContain("### TikTok Caption");
    expect(report).toContain("### YouTube Shorts Title");
    expect(report).toContain("### Facebook Reels Caption");
    expect(report).toContain("utm_source=tiktok");
    expect(report).toContain("https://lasotinhhoa.vn/#lap-la-so");
  });
});
