import { describe, expect, it } from "vitest";
import {
  buildTrafficAutopilotPlan,
  buildMarketingFrameworks,
  buildSocialDistribution,
  pickTrafficArticle,
} from "../../scripts/traffic/traffic-autopilot.mjs";

describe("Traffic Autopilot", () => {
  const existingSlugs = ["la-so-tu-vi-la-gi", "tao-la-so-tu-vi", "cach-doc-la-so-tu-vi-cho-nguoi-moi"];

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

  it("creates safe organic social distribution tasks on non-publisher weekdays", () => {
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-09T14:30:00.000Z"),
    });

    expect(plan.mode).toBe("organic-distribution");
    expect(plan.socialDistribution).toHaveLength(3);
    expect(plan.socialDistribution.map((item) => item.channel)).toEqual([
      "facebook-zalo-community",
      "short-video",
      "internal-link-flow",
    ]);
    expect(plan.socialDistribution.map((item) => item.link).join(" ")).toContain(
      "/kien-thuc-tu-vi/tao-la-so-tu-vi",
    );
    expect(plan.commands).toEqual(["npm run traffic:autopilot"]);
  });

  it("keeps paid ads and direct posting behind explicit approval", () => {
    const plan = buildTrafficAutopilotPlan({
      existingSlugs,
      now: new Date("2026-06-10T14:30:00.000Z"),
    });

    expect(plan.hardStops.join(" ")).toContain("Khong tu dong dang bai");
    expect(plan.hardStops.join(" ")).toContain("Khong chay quang cao tra phi");
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
    expect(plan.marketingFrameworks.appliedPrinciples.join(" ")).toContain("Social");
  });

  it("builds Vietnamese-ready snippets with chart creation as the compact CTA", () => {
    const article = pickTrafficArticle({ existingSlugs, preferredSlug: "tao-la-so-tu-vi" });
    const distribution = buildSocialDistribution({ article });
    const combinedCopy = distribution
      .flatMap((item) => [item.copy, ...(item.script || [])])
      .join(" ");

    expect(article.url).toBe("/kien-thuc-tu-vi/tao-la-so-tu-vi");
    expect(combinedCopy).toContain("/#lap-la-so");
    expect(combinedCopy).not.toMatch(/chac chan|bao dam|doi doi/i);
  });
});
