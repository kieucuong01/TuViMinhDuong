import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { countWords } from "@/lib/ai";
import {
  buildFreeOverviewFromInterpretationRules,
  buildFreeOverviewNarrativePlan,
  extractFreeOverviewFacts,
} from "@/lib/free-overview-engine";

function chartA() {
  return generateTuViChart({
    fullName: "Nguyễn Minh Anh",
    gender: "female",
    calendarType: "solar",
    day: 19,
    month: 5,
    year: 1990,
    birthHour: 8,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

function chartB() {
  return generateTuViChart({
    fullName: "Kiều Tấn Cường",
    gender: "male",
    calendarType: "solar",
    day: 3,
    month: 4,
    year: 1994,
    birthHour: 1,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

function chartC() {
  return generateTuViChart({
    fullName: "Nguyễn Hồ Bảo Linh",
    gender: "female",
    calendarType: "solar",
    day: 12,
    month: 8,
    year: 2008,
    birthHour: 7,
    birthMinute: 0,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

function normalizedSentences(content: string) {
  return content
    .replace(/\*\*/g, "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().replace(/\s+/g, " ").toLowerCase())
    .filter((sentence) => sentence.split(/\s+/).length >= 9);
}

function repeatedSentences(content: string) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const sentence of normalizedSentences(content)) {
    if (seen.has(sentence)) duplicates.add(sentence);
    seen.add(sentence);
  }
  return duplicates;
}

describe("free overview interpretation engine", () => {
  it("extracts important chart facts used by rule matching", () => {
    const facts = extractFreeOverviewFacts(chartA());

    expect(facts.mainStarPalaces.length).toBeGreaterThanOrEqual(12);
    expect(facts.importantPalaces.map((palace) => palace.name)).toEqual(
      expect.arrayContaining(["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"]),
    );
    expect(facts.currentDecade).toMatchObject({ palace: expect.any(String), range: expect.stringMatching(/^\d+-\d+$/) });
    expect(facts.yearlyActivatedPalaces.length).toBeGreaterThan(0);
  });

  it("selects different top interpretation rules for different charts while staying deterministic", () => {
    const first = buildFreeOverviewNarrativePlan(chartA());
    const again = buildFreeOverviewNarrativePlan(chartA());
    const second = buildFreeOverviewNarrativePlan(chartB());
    const third = buildFreeOverviewNarrativePlan(chartC());

    expect(first.selectedRules.map((rule) => rule.key)).toEqual(again.selectedRules.map((rule) => rule.key));
    expect(first.selectedRules).toHaveLength(5);
    expect(new Set(first.selectedRules.map((rule) => rule.key)).size).toBe(first.selectedRules.length);
    expect(new Set(first.selectedRules.map((rule) => rule.scope)).size).toBeGreaterThanOrEqual(3);
    expect(first.selectedRules.map((rule) => rule.key)).not.toEqual(second.selectedRules.map((rule) => rule.key));
    expect(first.selectedRules.map((rule) => rule.key)).not.toEqual(third.selectedRules.map((rule) => rule.key));
    expect(second.selectedRules.map((rule) => rule.key)).not.toEqual(third.selectedRules.map((rule) => rule.key));
  });

  it("composes a 1,400-1,650 word free overview with highlights, direct address, and no anchor section", () => {
    const overviewA = buildFreeOverviewFromInterpretationRules(chartA());
    const overviewB = buildFreeOverviewFromInterpretationRules(chartB());
    const overviewC = buildFreeOverviewFromInterpretationRules(chartC());

    for (const overview of [overviewA, overviewB, overviewC]) {
      expect(countWords(overview)).toBeGreaterThanOrEqual(1400);
      expect(countWords(overview)).toBeLessThanOrEqual(1650);
      expect(overview).toContain("# Bản đọc thử lá số tử vi");
      expect(overview).not.toContain("## Mỏ neo");
      expect(overview).toContain("## 1. Khí chất cốt lõi");
      expect(overview).toContain("## 2. Công việc và hướng đi");
      expect(overview).toContain("## 3. Tài chính và nguồn lực");
      expect(overview).toContain("## 4. Gia đình, quan hệ và nhịp sống");
      expect(overview).toContain("## Mở khóa bản luận giải chuyên sâu");
      expect(overview).toMatch(/\bbạn\b/);
      expect(overview).not.toContain("người đọc");
      expect(overview).not.toMatch(/\d+\/100/);
      expect(overview).not.toContain("**Điểm chính:**");
      expect(overview).not.toContain("**Cần chú ý:**");
      expect(overview).not.toContain("**Nên đọc tiếp:**");
      expect(overview).not.toContain("**Điểm bổ sung:**");
      expect(overview).not.toMatch(/Căn cứ:/);
      expect(overview).toMatch(/lá số cho thấy|trong lá số|dấu hiệu tử vi/i);
      expect(overview).toContain("tấm bản đồ");
      expect(overview).toContain("Những gì bạn vừa đọc chỉ là bề nổi");
      expect(overview).toContain("Bản Luận Giải Chuyên Sâu");
      expect(overview).toContain("lộ trình");
      expect(overview).toContain("mở khóa");
      expect(overview).not.toContain("tháng tử huyệt");
      expect(overview).not.toContain("thời điểm vàng");
      expect(overview).not.toMatch(/\b(vì|và|hoặc|nhưng|là|rằng|khi|nếu|mà)\./i);
      expect(overview).not.toMatch(/nhận việc hoặc\.|tưởng là an toàn nhưng lại\./i);
      expect(repeatedSentences(overview).size).toBe(0);
    }

    const openingA = overviewA.match(/## 1\. Khí chất cốt lõi: .+/)?.[0];
    const openingB = overviewB.match(/## 1\. Khí chất cốt lõi: .+/)?.[0];
    const openingC = overviewC.match(/## 1\. Khí chất cốt lõi: .+/)?.[0];
    expect(new Set([openingA, openingB, openingC]).size).toBeGreaterThanOrEqual(1);
    expect(overviewA).not.toContain("không dễ quyết theo cảm hứng nhất thời");
  });
});
