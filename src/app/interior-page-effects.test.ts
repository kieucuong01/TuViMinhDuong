import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const datePageSource = readFileSync(fileURLToPath(new URL("./xem-ngay/page.tsx", import.meta.url)), "utf8");
const dateViewSource = readFileSync(fileURLToPath(new URL("../components/date-view.tsx", import.meta.url)), "utf8");
const knowledgePageSource = readFileSync(fileURLToPath(new URL("./kien-thuc-tu-vi/page.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");

describe("interior page visual effects", () => {
  it("adds scoped visual surfaces to the date page without changing the date component contract", () => {
    expect(datePageSource).toContain("date-page-surface");
    expect(datePageSource).toContain("date-page-aura");
    expect(datePageSource).toContain("date-guide-panel");
    expect(datePageSource).toContain("date-guide-card");
    expect(datePageSource).toContain("date-faq-item");
    expect(dateViewSource).toContain("date-calendar-day active");
    expect(dateViewSource).toContain("fortune-gauge");
    expect(dateViewSource).toContain("date-task-card");
  });

  it("adds scoped visual surfaces to the knowledge hub", () => {
    expect(knowledgePageSource).toContain("knowledge-page-surface");
    expect(knowledgePageSource).toContain("knowledge-page-orbit");
    expect(knowledgePageSource).toContain("knowledge-path-panel");
    expect(knowledgePageSource).toContain("knowledge-path-card");
    expect(knowledgePageSource).toContain("knowledge-palace-panel");
    expect(knowledgePageSource).toContain("knowledge-palace-link");
  });

  it("defines restrained motion effects for date and knowledge surfaces", () => {
    expect(globalsCss).toContain("@keyframes date-page-orbit");
    expect(globalsCss).toContain("@keyframes date-active-pulse");
    expect(globalsCss).toContain("@keyframes page-card-glow");
    expect(globalsCss).toContain("@keyframes knowledge-thumb-sheen");
    expect(globalsCss).toMatch(/\.date-score-panel \.fortune-gauge::before\s*{[\s\S]*animation:\s*fortune-gauge-orbit/);
    expect(globalsCss).toMatch(/\.date-calendar-day\.active::before\s*{[\s\S]*animation:\s*date-active-pulse/);
    expect(globalsCss).toMatch(/\.knowledge-path-card::before,\s*\n\.knowledge-palace-link::before\s*{[\s\S]*linear-gradient/);
    expect(globalsCss).toMatch(/\.article-card:hover \.article-thumb\.image::after\s*{[\s\S]*knowledge-thumb-sheen/);
  });

  it("keeps the date hero score card separated from the desktop controls", () => {
    expect(globalsCss).toMatch(/@media \(min-width: 780px\)\s*{[\s\S]*\.date-quick-start\s*{[\s\S]*minmax\(13\.75rem, 0\.36fr\)/);
    expect(globalsCss).toMatch(/@media \(min-width: 1120px\)\s*{[\s\S]*\.date-quick-start\s*{[\s\S]*column-gap:\s*clamp\(1\.25rem, 2\.5vw, 2\.5rem\);[\s\S]*minmax\(13\.75rem, 14\.5rem\)[\s\S]*minmax\(20rem, 25rem\)/);
    expect(globalsCss).toMatch(/\.date-quick-score\s*{[\s\S]*justify-self:\s*start;[\s\S]*width:\s*min\(100%, 13\.75rem\);[\s\S]*transform:\s*translateX\(clamp\(-3rem, -3vw, -1\.25rem\)\)/);
    expect(globalsCss).toMatch(/\.date-quick-controls\s*{[\s\S]*justify-self:\s*end;[\s\S]*width:\s*min\(100%, 25rem\)/);
  });
});
