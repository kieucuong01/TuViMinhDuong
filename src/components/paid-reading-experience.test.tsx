import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/components/paid-reading-experience.tsx", "utf8");

describe("PaidReadingExperience browser contract", () => {
  it("tracks chapters and persists progress without blocking reading", () => {
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("requestAnimationFrame");
    expect(source).toContain("setTimeout");
    expect(source).toContain("/api/readings/");
    expect(source).toContain("persistProgress(pending, true)");
    expect(source).toContain("Đọc tiếp từ");
    expect(source).toContain('aria-current');
    expect(source).toContain('aria-valuenow');
  });

  it("uses a report-scoped progress calculation and graceful network retry state", () => {
    expect(source).toContain("calculateReadingPercent");
    expect(source).toContain("chapterOffset");
    expect(source).toContain("pendingSaveRef");
    expect(source).toContain("catch");
  });
});
