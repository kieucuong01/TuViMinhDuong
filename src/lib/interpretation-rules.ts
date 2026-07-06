import mainStarRules from "../data/interpretation-rules/main-stars.json";
import supportStarRules from "../data/interpretation-rules/support-stars.json";
import stateRules from "../data/interpretation-rules/states.json";
import axisRules from "../data/interpretation-rules/axes.json";
import fateRules from "../data/interpretation-rules/fate.json";

export const INTERPRETATION_RULE_VERSION = "interpretation-rules-v1";

export const MAIN_INTERPRETATION_STARS = [
  "Tử Vi",
  "Liêm Trinh",
  "Thiên Đồng",
  "Vũ Khúc",
  "Thái Dương",
  "Thiên Cơ",
  "Thiên Phủ",
  "Thái Âm",
  "Tham Lang",
  "Cự Môn",
  "Thiên Tướng",
  "Thiên Lương",
  "Thất Sát",
  "Phá Quân",
] as const;

export const INTERPRETATION_PALACES = [
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
] as const;

export const IMPORTANT_INTERPRETATION_PALACES = [
  "Mệnh",
  "Thân",
  "Quan Lộc",
  "Tài Bạch",
  "Phu Thê",
  "Tật Ách",
  "Thiên Di",
  "Phúc Đức",
] as const;

export const STAR_BRIGHTNESS_STATES = ["M", "V", "Đ", "B", "H"] as const;

export type InterpretationScope = "IDENTITY" | "CAREER" | "MONEY" | "RELATIONSHIP" | "HEALTH" | "YEAR" | "AXIS";

export type InterpretationPattern =
  | { kind: "main-star-palace"; star: string; palace: string }
  | { kind: "support-group"; group: string; palace: string; stars: string[] }
  | { kind: "gate"; gate: "Tuần" | "Triệt"; palace: string }
  | { kind: "state"; state: string }
  | { kind: "axis"; axis: string; palaces: string[] }
  | { kind: "fate"; fate: "dai-van" | "yearly"; palace: string };

export type InterpretationRule = {
  key: string;
  scope: InterpretationScope;
  pattern: InterpretationPattern;
  priority: number;
  title: string;
  summary: string;
  strengthText: string;
  cautionText: string;
  lifeAdviceText: string;
  teaserQuestion: string;
  evidenceLabel: string;
  version: string;
  status: "active" | "draft" | "archived";
};

function allSeedRules() {
  return [
    ...(mainStarRules as InterpretationRule[]),
    ...(supportStarRules as InterpretationRule[]),
    ...(stateRules as InterpretationRule[]),
    ...(axisRules as InterpretationRule[]),
    ...(fateRules as InterpretationRule[]),
  ];
}

export function loadInterpretationRules() {
  return allSeedRules().filter((rule) => rule.status === "active");
}

export function validateInterpretationRules(rules: InterpretationRule[] = loadInterpretationRules()) {
  const errors: string[] = [];
  const seen = new Set<string>();
  const forbidden = /TODO|TBD|placeholder|chết chắc|chắc chắn thất bại|số phận an bài/i;

  for (const rule of rules) {
    if (seen.has(rule.key)) errors.push(`duplicate key: ${rule.key}`);
    seen.add(rule.key);
    if (rule.version !== INTERPRETATION_RULE_VERSION) errors.push(`${rule.key}: invalid version`);
    if (rule.status !== "active") errors.push(`${rule.key}: inactive status`);
    if (!Number.isInteger(rule.priority) || rule.priority <= 0) errors.push(`${rule.key}: invalid priority`);
    for (const field of ["title", "summary", "strengthText", "cautionText", "lifeAdviceText", "teaserQuestion", "evidenceLabel"] as const) {
      if (!rule[field]?.trim()) errors.push(`${rule.key}: missing ${field}`);
    }
    if (!rule.teaserQuestion.trim().endsWith("?")) errors.push(`${rule.key}: teaser must be a question`);
    if (forbidden.test(JSON.stringify(rule))) errors.push(`${rule.key}: forbidden wording`);
  }

  return { ok: errors.length === 0, errors };
}
