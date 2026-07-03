import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/components/paid-reading-experience.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

describe("PaidReadingExperience browser contract", () => {
  it("tracks chapters and persists progress without blocking reading", () => {
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("requestAnimationFrame");
    expect(source).toContain("setTimeout");
    expect(source).toContain("/api/readings/");
    expect(source).toContain("persistProgress(pending, true)");
    expect(source).toContain("Đọc tiếp");
    expect(source).toContain('aria-current');
    expect(source).toContain('aria-valuenow');
    expect(source).not.toContain('className="paid-reading-resume"');
    expect(source).toContain('data-testid="paid-reading-progress-fab"');
    expect(source).toContain("scrollToChapter(chapters[progress.chapterIndex]");
  });

  it("uses a report-scoped progress calculation and graceful network retry state", () => {
    expect(source).toContain("calculateReadingPercent");
    expect(source).toContain("chapterOffset");
    expect(source).toContain("pendingSaveRef");
    expect(source).toContain("catch");
  });

  it("styles one fixed interactive progress control without a report-top resume card", () => {
    expect(css).toContain(".paid-reading-progress-fab");
    expect(css).toContain("position: fixed");
    expect(css).toContain("z-index: 80");
    expect(css).not.toContain(".paid-reading-resume");
  });

  it("keeps the floating progress and resume control visible while scrolling", () => {
    expect(source).toContain('className="paid-reading-progress-fab is-visible"');
    expect(source).not.toContain('className={`paid-reading-progress-fab ${isVisible || showResume ? "is-visible" : ""}`}');
    expect(css).toContain(".paid-reading-progress-fab.is-visible");
    expect(css).toContain("pointer-events: auto");
  });
});
