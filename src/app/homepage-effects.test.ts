import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");

describe("homepage balanced visual effects", () => {
  it("adds a subtle celestial layer behind the hero", () => {
    expect(globalsCss).toContain("@keyframes celestial-drift");
    expect(globalsCss).toMatch(/\.hero-band::before\s*{[\s\S]*conic-gradient/);
    expect(globalsCss).toMatch(/\.hero-band::before[\s\S]*animation:\s*celestial-drift\s+32s/);
  });

  it("gives the main chart CTA a restrained sheen", () => {
    expect(globalsCss).toContain("@keyframes home-sheen-sweep");
    expect(globalsCss).toMatch(/\.hero-form-card \.chart-form \.btn-primary::after\s*{/);
    expect(globalsCss).toMatch(/\.hero-form-card \.chart-form \.btn-primary:hover[\s\S]*translateY\(-1px\)/);
  });

  it("makes the chart form card stand out with a stable animated border", () => {
    expect(globalsCss).toContain("@keyframes form-border-orbit");
    expect(globalsCss).toContain("@property --form-border-angle");
    expect(globalsCss).not.toContain("form-soft-breathe");
    expect(globalsCss).not.toContain("form-aurora-glow");
    expect(globalsCss).not.toContain("form-border-trace");
    expect(globalsCss).toMatch(/\.hero-form-card\s*{[\s\S]*align-self:\s*start/);
    expect(globalsCss).toMatch(/\.hero-form-card\s*{[\s\S]*animation:\s*fade-up[\s\S]*;/);
    expect(globalsCss).toMatch(/\.hero-form-card::before\s*{[\s\S]*conic-gradient\(from var\(--form-border-angle\)/);
    expect(globalsCss).toMatch(/\.hero-form-card::before\s*{[\s\S]*mask-composite:\s*exclude/);
    expect(globalsCss).toMatch(/\.hero-form-card::before\s*{[\s\S]*animation:\s*form-border-orbit\s+6\.2s/);
    expect(globalsCss).toMatch(/\.hero-form-card::after\s*{[\s\S]*box-shadow:\s*inset 0 0 0 1px/);
    expect(globalsCss).toMatch(/\.hero-form-card:focus-within\s*{[\s\S]*box-shadow:/);
  });

  it("adds a dedicated sweep to the homepage Cat-Hung gauge", () => {
    expect(globalsCss).toContain("@keyframes fortune-gauge-orbit");
    expect(globalsCss).toContain("@keyframes fortune-gauge-glow");
    expect(globalsCss).toMatch(/\.day-fortune-card \.fortune-gauge::before\s*{[\s\S]*animation:\s*fortune-gauge-orbit\s+4\.8s/);
    expect(globalsCss).toMatch(/\.day-fortune-card \.fortune-gauge::after\s*{[\s\S]*animation:\s*fortune-gauge-glow\s+3\.6s/);
    expect(globalsCss).toMatch(/\.day-fortune-card \.fortune-gauge > div\s*{[\s\S]*z-index:\s*1/);
  });

  it("adds desktop hover polish while preserving reduced motion support", () => {
    expect(globalsCss).toMatch(/\.reader-comment-card:hover[\s\S]*translateY\(-2px\)/);
    expect(globalsCss).toMatch(/\.article-card:hover[\s\S]*translateY\(-2px\)/);
    expect(globalsCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration:\s*0\.001ms !important/);
  });
});
