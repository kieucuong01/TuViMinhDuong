import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { countWords } from "@/lib/ai";
import {
  buildFreeOverviewFromInterpretationRules,
  buildFreeOverviewNarrativePlan,
  extractFreeOverviewFacts,
} from "@/lib/free-overview-engine";

function makeChart(fullName: string, gender: "male" | "female", day: number, month: number, year: number, birthHour: number) {
  return generateTuViChart({
    fullName,
    gender,
    calendarType: "solar",
    day,
    month,
    year,
    birthHour,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

const charts = [
  makeChart("Nguyễn Minh Anh", "female", 19, 5, 1990, 8),
  makeChart("Kiều Tấn Cường", "male", 3, 4, 1994, 1),
  makeChart("Nguyễn Hồ Bảo Linh", "female", 12, 8, 2008, 7),
];

function repeatedSentences(content: string) {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const sentence of content
    .replace(/\*\*/g, "")
    .split(/(?<=[.!?])\s+/u)
    .map((item) => item.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi"))
    .filter((item) => item.split(/\s+/u).length >= 9)) {
    if (seen.has(sentence)) repeated.add(sentence);
    seen.add(sentence);
  }
  return repeated;
}

describe("free overview interpretation engine", () => {
  it("extracts concrete chart facts used by rule matching", () => {
    const facts = extractFreeOverviewFacts(charts[0]);

    expect(facts.mainStarPalaces.length).toBeGreaterThanOrEqual(12);
    expect(facts.importantPalaces.map((palace) => palace.name)).toEqual(
      expect.arrayContaining(["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"]),
    );
    expect(facts.currentDecade).toMatchObject({ palace: expect.any(String), range: expect.stringMatching(/^\d+-\d+$/) });
    expect(facts.yearlyActivatedPalaces.length).toBeGreaterThan(0);
  });

  it("selects four deterministic clusters with no more than eight unique, scope-aligned rules", () => {
    const plans = charts.map(buildFreeOverviewNarrativePlan);
    const again = buildFreeOverviewNarrativePlan(charts[0]);

    expect(plans[0].clusters).toEqual(again.clusters);
    for (const plan of plans) {
      expect(plan.clusters.map((cluster) => cluster.title)).toEqual([
        "Khí chất và cách ra quyết định",
        "Công việc và nguồn lực",
        "Quan hệ và nhịp sống",
        "Vận hiện tại",
      ]);
      expect(plan.clusters).toHaveLength(4);
      expect(plan.selectedRules.length).toBeGreaterThanOrEqual(4);
      expect(plan.selectedRules.length).toBeLessThanOrEqual(8);
      expect(new Set(plan.selectedRules.map((rule) => rule.key)).size).toBe(plan.selectedRules.length);
      expect(plan.clusters[0].primary.scope).toMatch(/IDENTITY|AXIS/);
      expect(plan.clusters[1].primary.scope).toMatch(/CAREER|MONEY/);
      expect(plan.clusters[2].primary.scope).toMatch(/RELATIONSHIP|HEALTH/);
      expect(plan.clusters[3].primary.pattern.kind).toBe("fate");
    }

    expect(plans[0].selectedRules.map((rule) => rule.key)).not.toEqual(plans[1].selectedRules.map((rule) => rule.key));
    expect(plans[1].selectedRules.map((rule) => rule.key)).not.toEqual(plans[2].selectedRules.map((rule) => rule.key));
  });

  it("composes three distinct seed-only overviews of 1,400-1,650 words", () => {
    const overviews = charts.map(buildFreeOverviewFromInterpretationRules);

    for (const overview of overviews) {
      expect(countWords(overview)).toBeGreaterThanOrEqual(1400);
      expect(countWords(overview)).toBeLessThanOrEqual(1650);
      expect(overview).toContain("# Bản tổng quan lá số của bạn");
      expect(overview).toContain("## 1. Khí chất và cách ra quyết định");
      expect(overview).toContain("## 2. Công việc và nguồn lực");
      expect(overview).toContain("## 3. Quan hệ và nhịp sống");
      expect(overview).toContain("## 4. Vận hiện tại");
      expect(overview).toContain("## Hai câu hỏi để bạn tự đối chiếu");
      expect(overview).toContain("Bản FULL 9 chương");
      expect(overview).toMatch(/\bbạn\b/iu);
      expect(overview).not.toMatch(/người đọc|người này|đương số|\bmình\b/iu);
      expect(overview).not.toContain("phần còn đang được giữ lại");
      expect(overview).not.toContain("tảng băng chìm");
      expect(overview).not.toContain("giống như");
      expect(overview).not.toContain("Căn cứ:");
      expect([...repeatedSentences(overview)]).toEqual([]);

      const questions = overview.split("## Hai câu hỏi để bạn tự đối chiếu")[1]?.match(/^- .+\?$/gmu) ?? [];
      expect(questions).toHaveLength(2);
    }

    expect(new Set(overviews).size).toBe(3);
  });
});
