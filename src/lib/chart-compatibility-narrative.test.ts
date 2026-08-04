import { describe, expect, it } from "vitest";
import {
  auditNarrativeUniqueness,
  buildThemeNarrative,
  NarrativeLedger,
  selectStableVariant,
  type CompatibilityNarrativeThemeKey,
  type NarrativeContext,
} from "@/lib/chart-compatibility-narrative";

const baseContext: Omit<NarrativeContext, "key"> = {
  level: "coordinate",
  interaction: "complementary",
  seed: "minh:an",
  first: {
    name: "Minh",
    traits: ["analysis"],
    primaryNeed: "hiểu rõ việc đang xảy ra",
    reassurance: "có đủ thời gian cân nhắc",
    contribution: "kiểm tra kỹ những điểm còn bỏ ngỏ",
    friction: "chậm chốt khi thông tin chưa đủ",
  },
  second: {
    name: "An",
    traits: ["action"],
    primaryNeed: "thấy việc được chuyển động",
    reassurance: "có một bước tiếp theo rõ ràng",
    contribution: "mở việc nhanh và giữ đà hành động",
    friction: "dễ sốt ruột khi phải chờ quá lâu",
  },
};

const makeContext = (key: CompatibilityNarrativeThemeKey): NarrativeContext => ({ ...baseContext, key });

describe("compatibility narrative selector", () => {
  it("selects the same variant for the same seed", () => {
    const variants = [
      { family: "scene-first", value: "a" },
      { family: "contrast-first", value: "b" },
      { family: "need-first", value: "c" },
    ];

    expect(selectStableVariant(variants, "finance:minh:an", new Set())).toEqual(
      selectStableVariant(variants, "finance:minh:an", new Set()),
    );
  });

  it("moves to an unused family when the preferred family is already present", () => {
    const used = new Set(["scene-first"]);
    const result = selectStableVariant(
      [
        { family: "scene-first", value: "a" },
        { family: "contrast-first", value: "b" },
      ],
      "communication:minh:an",
      used,
    );

    expect(result.family).toBe("contrast-first");
  });
});

describe("topic-specific compatibility narratives", () => {
  it.each([
    ["temperament", "khi nhịp sống bị xáo trộn"],
    ["communication", "một cuộc trao đổi"],
    ["commitment", "cảm giác được đồng hành"],
    ["finance", "một khoản chi"],
    ["work", "một việc chung"],
    ["family", "nếp sống chung"],
  ] as const)("gives %s its own real-life scene", (key, expectedScene) => {
    const result = buildThemeNarrative(makeContext(key), new NarrativeLedger());

    expect(result.possibleExpression.toLowerCase()).toContain(expectedScene);
  });

  it("writes a complete reading rather than returning fragments", () => {
    const result = buildThemeNarrative(makeContext("communication"), new NarrativeLedger());

    expect(result.summary.length).toBeGreaterThan(120);
    expect(result.whyItMatters.length).toBeGreaterThan(100);
    expect(result.possibleExpression.length).toBeGreaterThan(100);
    expect(result.actions).toHaveLength(2);
    expect(result.questions).toHaveLength(2);
  });
});

describe("report-wide narrative uniqueness", () => {
  it("detects normalized duplicate sentences and long repeated phrases", () => {
    const makeTheme = (summary: string) => ({
      summary,
      whyItMatters: "Một góc nhìn riêng không trùng với phần còn lại.",
      possibleExpression: "Một tình huống riêng không trùng với phần còn lại.",
    });
    const audit = auditNarrativeUniqueness([
      makeTheme("Minh cần một khoảng lặng trước khi nói tiếp. Hai người nên hẹn giờ quay lại."),
      makeTheme("Minh cần một khoảng lặng trước khi nói tiếp! Hai người có thể thử hẹn giờ quay lại."),
    ]);

    expect(audit.duplicateSentences).toContain("minh cần một khoảng lặng trước khi nói tiếp");
    expect(audit.repeatedNgrams.length).toBeGreaterThan(0);
  });
});
