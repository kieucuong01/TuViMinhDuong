import { describe, expect, it } from "vitest";
import {
  INTERPRETATION_RULE_VERSION,
  IMPORTANT_INTERPRETATION_PALACES,
  MAIN_INTERPRETATION_STARS,
  STAR_BRIGHTNESS_STATES,
  loadInterpretationRules,
  validateInterpretationRules,
} from "@/lib/interpretation-rules";

describe("interpretation rule knowledge base", () => {
  const rules = loadInterpretationRules();

  it("materializes a broad rule catalog with unique reviewed keys and required text fields", () => {
    const validation = validateInterpretationRules(rules);

    expect(validation.ok).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(rules.length).toBeGreaterThanOrEqual(240);
    expect(new Set(rules.map((rule) => rule.key)).size).toBe(rules.length);

    for (const rule of rules) {
      expect(rule.version).toBe(INTERPRETATION_RULE_VERSION);
      expect(rule.status).toBe("active");
      expect(rule.priority).toBeGreaterThan(0);
      expect(rule.title.trim()).not.toBe("");
      expect(rule.summary.trim()).not.toBe("");
      expect(rule.strengthText.trim()).not.toBe("");
      expect(rule.cautionText.trim()).not.toBe("");
      expect(rule.lifeAdviceText.trim()).not.toBe("");
      expect(rule.teaserQuestion.trim()).toMatch(/\?$/);
      expect(rule.evidenceLabel.trim()).not.toBe("");
      expect(JSON.stringify(rule)).not.toMatch(/TODO|TBD|placeholder|chết chắc|chắc chắn thất bại|số phận an bài/i);
    }
  });

  it("stores curated per-combination prose instead of obvious generated templates", () => {
    const mainStarRules = rules.filter((rule) => rule.pattern.kind === "main-star-palace");
    const repeatedTemplateFragments = [
      /đặt ở cung .+ làm nổi bật/i,
      /không chỉ là tên một cung/i,
      /khi .+ xuất hiện ở đây/i,
      /là vùng đời sống liên quan tới/i,
    ];

    for (const rule of mainStarRules) {
      const prose = [rule.summary, rule.strengthText, rule.cautionText, rule.lifeAdviceText].join(" ");
      for (const fragment of repeatedTemplateFragments) {
        expect(prose).not.toMatch(fragment);
      }
    }

    for (const star of MAIN_INTERPRETATION_STARS) {
      const starRules = mainStarRules.filter((rule) => rule.pattern.star === star);
      expect(starRules).toHaveLength(12);
      expect(new Set(starRules.map((rule) => rule.summary.slice(0, 80))).size).toBe(12);
      expect(new Set(starRules.map((rule) => rule.lifeAdviceText.slice(0, 80))).size).toBe(12);
    }
  });

  it("covers all main stars across all twelve palaces", () => {
    const mainStarRules = rules.filter((rule) => rule.pattern.kind === "main-star-palace");

    expect(mainStarRules).toHaveLength(MAIN_INTERPRETATION_STARS.length * 12);
    for (const star of MAIN_INTERPRETATION_STARS) {
      const palaces = new Set(
        mainStarRules
          .filter((rule) => rule.pattern.star === star)
          .map((rule) => rule.pattern.palace),
      );
      expect(palaces).toEqual(new Set([
        "Mệnh",
        "Phụ Mẫu",
        "Phúc Đức",
        "Điền Trạch",
        "Quan Lộc",
        "Nô Bộc",
        "Thiên Di",
        "Tật Ách",
        "Tài Bạch",
        "Tử Tức",
        "Phu Thê",
        "Huynh Đệ",
      ]));
    }
  });

  it("covers important palaces, star states, axes, and fate activations", () => {
    for (const palace of IMPORTANT_INTERPRETATION_PALACES) {
      expect(rules.some((rule) => rule.pattern.kind === "gate" && rule.pattern.palace === palace && rule.pattern.gate === "Tuần")).toBe(true);
      expect(rules.some((rule) => rule.pattern.kind === "gate" && rule.pattern.palace === palace && rule.pattern.gate === "Triệt")).toBe(true);
    }

    for (const state of STAR_BRIGHTNESS_STATES) {
      expect(rules.some((rule) => rule.pattern.kind === "state" && rule.pattern.state === state)).toBe(true);
    }

    expect(rules.filter((rule) => rule.pattern.kind === "axis")).toHaveLength(6);
    expect(rules.some((rule) => rule.pattern.kind === "fate" && rule.pattern.fate === "dai-van")).toBe(true);
    expect(rules.some((rule) => rule.pattern.kind === "fate" && rule.pattern.fate === "yearly")).toBe(true);
  });
});
