import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  INTERPRETATION_PALACES,
  INTERPRETATION_RULE_VERSION,
  MAIN_INTERPRETATION_STARS,
  STAR_BRIGHTNESS_STATES,
  loadInterpretationRules,
  validateInterpretationRules,
} from "@/lib/interpretation-rules";

const ruleDir = join(process.cwd(), "src/data/interpretation-rules");

type SeedRule = ReturnType<typeof loadInterpretationRules>[number];

function loadRuleFile(fileName: string) {
  return JSON.parse(readFileSync(join(ruleDir, fileName), "utf8")) as SeedRule[];
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(getKey(item), (counts.get(getKey(item)) ?? 0) + 1);
  return counts;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}
describe("interpretation rule knowledge base", () => {
  const rules = loadInterpretationRules();

  it("ships the complete v2 seed files with the expected rule counts", () => {
    expect(readdirSync(ruleDir).filter((file) => file.endsWith(".json")).sort()).toEqual([
      "axes.json",
      "fate.json",
      "main-stars.json",
      "states.json",
      "support-stars.json",
    ]);

    expect(loadRuleFile("main-stars.json")).toHaveLength(168);
    expect(loadRuleFile("support-stars.json")).toHaveLength(56);
    expect(loadRuleFile("states.json")).toHaveLength(5);
    expect(loadRuleFile("axes.json")).toHaveLength(6);
    expect(loadRuleFile("fate.json")).toHaveLength(16);
    expect(rules).toHaveLength(251);
  });

  it("covers all 14 main stars across all 12 palaces", () => {
    const mainStarRules = rules.filter((rule) => rule.pattern.kind === "main-star-palace");
    const countsByStar = countBy(mainStarRules, (rule) => (rule.pattern.kind === "main-star-palace" ? rule.pattern.star : ""));
    const countsByPalace = countBy(mainStarRules, (rule) => (rule.pattern.kind === "main-star-palace" ? rule.pattern.palace : ""));

    expect(mainStarRules).toHaveLength(MAIN_INTERPRETATION_STARS.length * INTERPRETATION_PALACES.length);
    for (const star of MAIN_INTERPRETATION_STARS) expect(countsByStar.get(star)).toBe(INTERPRETATION_PALACES.length);
    for (const palace of INTERPRETATION_PALACES) expect(countsByPalace.get(palace)).toBe(MAIN_INTERPRETATION_STARS.length);
  });

  it("covers support groups, Tuần/Triệt gates, brightness states, axes, and active fate periods", () => {
    const supportRules = rules.filter((rule) => rule.pattern.kind === "support-group");
    const gateRules = rules.filter((rule) => rule.pattern.kind === "gate");
    const stateRules = rules.filter((rule) => rule.pattern.kind === "state");
    const axisRules = rules.filter((rule) => rule.pattern.kind === "axis");
    const fateRules = rules.filter((rule) => rule.pattern.kind === "fate");

    expect(supportRules).toHaveLength(40);
    expect(gateRules).toHaveLength(16);
    expect(stateRules.map((rule) => (rule.pattern.kind === "state" ? rule.pattern.state : "")).sort()).toEqual(
      [...STAR_BRIGHTNESS_STATES].sort(),
    );
    expect(axisRules.map((rule) => (rule.pattern.kind === "axis" ? rule.pattern.axis : "")).sort()).toEqual([
      "di-quan",
      "menh-than",
      "phu-phuc",
      "quan-tai",
      "tai-phuc",
      "tat-menh",
    ]);
    expect(fateRules.filter((rule) => rule.pattern.kind === "fate" && rule.pattern.fate === "dai-van")).toHaveLength(8);
    expect(fateRules.filter((rule) => rule.pattern.kind === "fate" && rule.pattern.fate === "yearly")).toHaveLength(8);
  });

  it("keeps every rule valid and aligned with the freemium copy standard", () => {
    const validation = validateInterpretationRules(rules);
    const fullTexts = new Set<string>();
    const limits = {
      summary: [45, 80],
      strengthText: [25, 50],
      cautionText: [25, 50],
      lifeAdviceText: [30, 60],
      teaserQuestion: [12, 35],
      evidenceLabel: [15, 40],
    } as const;

    expect(validation.errors).toEqual([]);
    expect(validation.ok).toBe(true);
    expect(new Set(rules.map((rule) => rule.key)).size).toBe(rules.length);

    for (const rule of rules) {
      expect(rule.version).toBe(INTERPRETATION_RULE_VERSION);
      expect(rule.status).toBe("active");
      expect(rule.priority).toBeGreaterThan(0);
      expect(rule.title.trim()).not.toBe("");
      expect(rule.summary).toMatch(/^(Bạn thường|Bạn dễ|Có những lúc bạn)(?:\s|$)/u);
      expect(rule.strengthText).toMatch(/^Khi(?:\s|$).+\bbạn\b/iu);
      expect(rule.cautionText).toMatch(/^(Nếu kéo dài,|Khi quá|Bạn có thể dễ)(?:\s|$)/iu);
      expect(rule.lifeAdviceText).toMatch(/\bbạn\b/iu);
      expect(rule.teaserQuestion.trim()).toMatch(/\?$/);
      expect(rule.evidenceLabel).not.toMatch(/^Căn cứ:/i);
      expect(JSON.stringify(rule)).not.toMatch(/TODO|TBD|placeholder|thầy bói|số phận an bài|chết chắc|chắc chắn thất bại|người đọc|người này|đương số|\bmình\b|bạn mạnh mẽ nhưng đôi lúc yếu lòng/iu);
      expect(JSON.stringify(rule)).not.toMatch(/\b(vì|và|hoặc|nhưng|là|rằng|khi|nếu|mà)\./i);
      expect(JSON.stringify(rule)).not.toMatch(/nhận việc hoặc\.|tưởng là an toàn nhưng lại\./i);

      for (const field of ["summary", "strengthText", "cautionText", "lifeAdviceText", "teaserQuestion", "evidenceLabel"] as const) {
        const [minimum, maximum] = limits[field];
        expect(wordCount(rule[field]), `${rule.key}:${field}`).toBeGreaterThanOrEqual(minimum);
        expect(wordCount(rule[field]), `${rule.key}:${field}`).toBeLessThanOrEqual(maximum);
        if (field !== "evidenceLabel") expect(rule[field], `${rule.key}:${field}`).toMatch(/\bbạn\b/iu);
        const signature = `${field}:${rule[field].trim()}`;
        expect(fullTexts.has(signature)).toBe(false);
        fullTexts.add(signature);
      }
    }
  });
  it("rejects generic, distant, duplicate, and near-duplicate copy", () => {
    const base = rules[0];
    const invalid = [
      { ...base, key: "quality:a", summary: "Bạn mạnh mẽ nhưng đôi lúc yếu lòng." },
      { ...base, key: "quality:b", summary: "Bạn mạnh mẽ, nhưng đôi lúc cũng yếu lòng." },
    ];

    const validation = validateInterpretationRules(invalid);

    expect(validation.ok).toBe(false);
    expect(validation.errors.join("\n")).toMatch(/summary|generic|duplicate|near-duplicate/i);
  });
});
