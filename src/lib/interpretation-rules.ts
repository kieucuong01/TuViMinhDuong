import mainStarRules from "../data/interpretation-rules/main-stars.json" with { type: "json" };
import supportStarRules from "../data/interpretation-rules/support-stars.json" with { type: "json" };
import stateRules from "../data/interpretation-rules/states.json" with { type: "json" };
import axisRules from "../data/interpretation-rules/axes.json" with { type: "json" };
import fateRules from "../data/interpretation-rules/fate.json" with { type: "json" };

export const INTERPRETATION_RULE_VERSION = "interpretation-rules-v2";

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

export const INTERPRETATION_RULE_COUNT = 251;

const CUSTOMER_FIELDS = ["summary", "strengthText", "cautionText", "lifeAdviceText", "teaserQuestion"] as const;
const RULE_FIELD_LIMITS = {
  summary: [45, 80],
  strengthText: [25, 50],
  cautionText: [25, 50],
  lifeAdviceText: [30, 60],
  teaserQuestion: [12, 35],
  evidenceLabel: [15, 40],
} as const;
const PALACE_CONTEXT_WORDS: Record<string, string[]> = {
  Mệnh: ["bản thân", "cá nhân", "tự quyết", "khí chất", "trách nhiệm"],
  Thân: ["vai trò", "lịch sống", "hành động", "thực tế", "dùng sức"],
  "Phụ Mẫu": ["cha mẹ", "người lớn", "gia đình", "cấp trên", "kỳ vọng"],
  "Phúc Đức": ["nếp nhà", "gia đình", "niềm tin", "tinh thần", "gốc rễ"],
  "Điền Trạch": ["nhà", "tài sản", "chỗ ở", "gia đình", "ổn định"],
  "Quan Lộc": ["công việc", "nghề", "vai trò", "sự nghiệp", "trách nhiệm"],
  "Nô Bộc": ["đồng nghiệp", "bạn bè", "hợp tác", "nhóm", "người cùng"],
  "Thiên Di": ["môi trường", "bên ngoài", "cơ hội", "người lạ", "ra ngoài"],
  "Tật Ách": ["sức khỏe", "nhịp nghỉ", "quá tải", "hồi phục", "thân tâm"],
  "Tài Bạch": ["tiền", "tài chính", "nguồn lực", "thu nhập", "công sức"],
  "Tử Tức": ["con cái", "dự án", "nuôi dưỡng", "sáng tạo", "thế hệ sau"],
  "Phu Thê": ["tình cảm", "cam kết", "quan hệ", "hai bên", "bạn đời"],
  "Huynh Đệ": ["anh em", "anh chị em", "bạn thân", "cùng thế hệ", "người thân"],
};

function countRuleWords(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function normalizedCopy(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCopies(value: string) {
  return value
    .split(/(?<=[.!?])\s+/u)
    .map(normalizedCopy)
    .filter((sentence) => sentence.split(" ").length >= 8);
}

function copySimilarity(a: Set<string>, b: Set<string>) {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(1, a.size + b.size - shared);
}

function rulePalace(rule: InterpretationRule) {
  if ("palace" in rule.pattern) return rule.pattern.palace;
  return null;
}

export function validateInterpretationRules(rules: InterpretationRule[] = loadInterpretationRules()) {
  const errors: string[] = [];
  const seenKeys = new Set<string>();
  const copyEntries: Array<{ key: string; field: string; copy: string; tokens: Set<string> }> = [];
  const forbidden = /TODO|TBD|placeholder|thầy bói|chết chắc|chắc chắn thất bại|số phận an bài|người đọc|người này|đương số|\bmình\b|bạn mạnh mẽ nhưng đôi lúc(?: cũng)? yếu lòng/iu;

  if (rules.length !== INTERPRETATION_RULE_COUNT) errors.push(`expected ${INTERPRETATION_RULE_COUNT} active rules, received ${rules.length}`);

  for (const rule of rules) {
    if (seenKeys.has(rule.key)) errors.push(`duplicate key: ${rule.key}`);
    seenKeys.add(rule.key);
    if (rule.version !== INTERPRETATION_RULE_VERSION) errors.push(`${rule.key}: invalid version`);
    if (rule.status !== "active") errors.push(`${rule.key}: inactive status`);
    if (!Number.isInteger(rule.priority) || rule.priority <= 0) errors.push(`${rule.key}: invalid priority`);

    for (const field of ["title", ...CUSTOMER_FIELDS, "evidenceLabel"] as const) {
      if (!rule[field]?.trim()) errors.push(`${rule.key}: missing ${field}`);
    }

    for (const [field, [minimum, maximum]] of Object.entries(RULE_FIELD_LIMITS) as Array<[
      keyof typeof RULE_FIELD_LIMITS,
      readonly [number, number],
    ]>) {
      const total = countRuleWords(rule[field]);
      if (total < minimum || total > maximum) errors.push(`${rule.key}: ${field} has ${total} words, expected ${minimum}-${maximum}`);
      for (const copy of sentenceCopies(rule[field])) copyEntries.push({ key: rule.key, field, copy, tokens: new Set(copy.split(" ")) });
    }

    for (const field of CUSTOMER_FIELDS) {
      if (!/\bbạn\b/iu.test(rule[field])) errors.push(`${rule.key}: ${field} must address bạn`);
    }
    if (!/^(Bạn thường|Bạn dễ|Có những lúc bạn)(?:\s|$)/u.test(rule.summary)) errors.push(`${rule.key}: summary must start with a recognizable behavior`);
    if (!/^Khi\b.+\bbạn\b/iu.test(rule.strengthText)) errors.push(`${rule.key}: strengthText must be conditional`);
    if (!/^(Nếu kéo dài,|Khi quá|Bạn có thể dễ)(?:\s|$)/iu.test(rule.cautionText)) errors.push(`${rule.key}: cautionText must stay conditional`);
    if (!rule.teaserQuestion.trim().endsWith("?")) errors.push(`${rule.key}: teaser must be a question`);
    if (forbidden.test(JSON.stringify(rule))) errors.push(`${rule.key}: forbidden or generic wording`);

    const palace = rulePalace(rule);
    const contextWords = palace ? PALACE_CONTEXT_WORDS[palace] : null;
    if (contextWords) {
      const copy = normalizedCopy(`${rule.summary} ${rule.strengthText} ${rule.cautionText} ${rule.lifeAdviceText}`);
      if (!contextWords.some((word) => copy.includes(normalizedCopy(word)))) errors.push(`${rule.key}: copy is not aligned with ${palace}`);
    }
    if (rule.pattern.kind === "main-star-palace" && !rule.title.includes(rule.pattern.star)) {
      errors.push(`${rule.key}: title is not aligned with ${rule.pattern.star}`);
    }
  }

  for (let index = 0; index < copyEntries.length; index += 1) {
    const left = copyEntries[index];
    for (let otherIndex = index + 1; otherIndex < copyEntries.length; otherIndex += 1) {
      const right = copyEntries[otherIndex];
      if (left.key === right.key || left.field !== right.field) continue;
      if (Math.min(left.tokens.size, right.tokens.size) / Math.max(left.tokens.size, right.tokens.size) < 0.94) continue;
      if (left.copy === right.copy) errors.push(`${left.key}/${right.key}: duplicate ${left.field}`);
      else if (copySimilarity(left.tokens, right.tokens) >= 0.94) errors.push(`${left.key}/${right.key}: near-duplicate ${left.field}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
