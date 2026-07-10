import type { TuViChart } from "@/lib/chart";
import {
  IMPORTANT_INTERPRETATION_PALACES,
  type InterpretationRule,
  loadInterpretationRules,
} from "@/lib/interpretation-rules";

type FreeOverviewPalaceFact = {
  name: string;
  actualName: string;
  branch: string;
  mainStars: string[];
  supportStars: string[];
  yearlyStars: string[];
  starStates: Record<string, string>;
  lifecycle: string;
};

export type FreeOverviewFacts = {
  age: number;
  address: string;
  lifeContext: string;
  menhThanLabel: string;
  currentDecade: { palace: string; branch: string; range: string };
  importantPalaces: FreeOverviewPalaceFact[];
  mainStarPalaces: Array<{ star: string; palace: string; branch: string; state?: string }>;
  gates: Array<{ gate: "Tuần" | "Triệt"; palace: string; actualPalace: string }>;
  supportGroups: Array<{ group: string; palace: string; stars: string[] }>;
  states: Array<{ state: string; palace: string; star: string }>;
  yearlyActivatedPalaces: Array<{ palace: string; stars: string[] }>;
};

export type ScoredInterpretationRule = InterpretationRule & {
  score: number;
  evidence: string;
};

export type FreeOverviewNarrativePlan = {
  facts: FreeOverviewFacts;
  selectedRules: ScoredInterpretationRule[];
  allMatches: ScoredInterpretationRule[];
};

type FreeOverviewInsight = {
  key: string;
  topic: string;
  title: string;
  summary: string;
  strength: string;
  caution: string;
  advice: string;
  evidence: string;
  teaserQuestion: string;
  score: number;
};

function countWords(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function chartAge(chart: TuViChart) {
  return chart.input.viewYear - chart.solar.year;
}

function lifeContext(chart: TuViChart) {
  const age = chartAge(chart);
  if (age <= 21) return "Ở tuổi này, ví dụ gần nhất là lịch học, bài tập nhóm, chọn ngành, bạn bè, tiền tiêu vặt và việc part-time.";
  if (age <= 29) return "Ở giai đoạn này, trọng tâm thường là vào nghề, chọn môi trường, tự lập tài chính và xây kỹ năng nền.";
  return "Ở giai đoạn trưởng thành, trọng tâm thường là công việc, tiền bạc, gia đình, quan hệ thân thiết và nhịp nghỉ.";
}

function currentDecade(chart: TuViChart) {
  const age = chartAge(chart);
  return (
    chart.daiVan.find((period) => {
      const [start, end] = period.range.split("-").map(Number);
      return age >= start && age <= end;
    }) || chart.daiVan[0]
  );
}

function palaceByName(chart: TuViChart, name: string) {
  if (name === "Thân") return chart.palaces.find((palace) => palace.isThan);
  return chart.palaces.find((palace) => palace.name === name);
}

function starsForGroup(stars: string[], groupStars: string[]) {
  return stars.filter((star) => groupStars.some((groupStar) => star.includes(groupStar)));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function palaceFact(chart: TuViChart, name: string): FreeOverviewPalaceFact | null {
  const palace = palaceByName(chart, name);
  if (!palace) return null;
  return {
    name,
    actualName: palace.name,
    branch: palace.branch,
    mainStars: palace.mainStars,
    supportStars: palace.supportStars,
    yearlyStars: palace.yearlyStars,
    starStates: palace.starStates,
    lifecycle: palace.lifecycle,
  };
}

export function extractFreeOverviewFacts(chart: TuViChart): FreeOverviewFacts {
  const decade = currentDecade(chart);
  const importantPalaces = IMPORTANT_INTERPRETATION_PALACES
    .map((name) => palaceFact(chart, name))
    .filter((item): item is FreeOverviewPalaceFact => Boolean(item));

  const mainStarPalaces = chart.palaces.flatMap((palace) =>
    palace.mainStars
      .filter((star) => star !== "Vô chính diệu")
      .map((star) => ({ star, palace: palace.name, branch: palace.branch, state: palace.starStates[star] })),
  );

  const gates = importantPalaces.flatMap((palace) =>
    (["Tuần", "Triệt"] as const)
      .filter((gate) => palace.supportStars.includes(gate))
      .map((gate) => ({ gate, palace: palace.name, actualPalace: palace.actualName })),
  );

  const supportGroups = importantPalaces.flatMap((palace) => {
    const stars = [...palace.supportStars, ...palace.yearlyStars];
    const groups = [
      { group: "cát tinh", stars: ["Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Khôi", "Việt", "Long Trì", "Phượng"] },
      { group: "sát tinh", stars: ["Kình", "Đà", "Hỏa", "Linh", "Không", "Kiếp"] },
      { group: "hao tinh", stars: ["Đại Hao", "Tiểu Hao", "Hao"] },
      { group: "đào hoa", stars: ["Đào Hoa", "Hồng Loan", "Thiên Hỷ", "Hỷ Thần"] },
      { group: "khoa quyền lộc kỵ", stars: ["Hóa Khoa", "Hóa Quyền", "Hóa Lộc", "Hóa Kỵ"] },
    ];
    return groups
      .map((group) => ({ group: group.group, palace: palace.name, stars: unique(starsForGroup(stars, group.stars)) }))
      .filter((group) => group.stars.length > 0);
  });

  const states = importantPalaces.flatMap((palace) =>
    [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars]
      .map((star) => ({ star, state: palace.starStates[star], palace: palace.name }))
      .filter((item): item is { star: string; state: string; palace: string } => Boolean(item.state)),
  );

  const yearlyActivatedPalaces = importantPalaces
    .filter((palace) => palace.yearlyStars.length > 0)
    .map((palace) => ({ palace: palace.name, stars: palace.yearlyStars.slice(0, 4) }));

  return {
    age: chartAge(chart),
    address: "bạn",
    lifeContext: lifeContext(chart),
    menhThanLabel: `Mệnh ${chart.menh} / Thân ${chart.than}; ${chart.menhCucRelation}; ${chart.cuc}`,
    currentDecade: decade,
    importantPalaces,
    mainStarPalaces,
    gates,
    supportGroups,
    states,
    yearlyActivatedPalaces,
  };
}

function palaceWeight(name: string) {
  if (name === "Mệnh" || name === "Thân") return 24;
  if (["Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"].includes(name)) return 18;
  if (name === "Phúc Đức") return 14;
  return 6;
}

function stripEvidenceLabel(value: string) {
  return value.replace(/^Căn cứ:\s*/i, "").trim();
}

function ruleEvidence(rule: InterpretationRule, facts: FreeOverviewFacts) {
  const pattern = rule.pattern;
  if (pattern.kind === "main-star-palace") {
    const fact = facts.mainStarPalaces.find((item) => item.star === pattern.star && item.palace === pattern.palace);
    return fact
      ? `Trong lá số, ${pattern.star}${fact.state ? ` (${fact.state})` : ""} nằm tại cung ${pattern.palace} ở địa chi ${fact.branch}.`
      : stripEvidenceLabel(rule.evidenceLabel);
  }
  if (pattern.kind === "gate") {
    const gate = facts.gates.find((item) => item.gate === pattern.gate && item.palace === pattern.palace);
    return gate
      ? `Lá số cho thấy ${pattern.gate} án tại ${pattern.palace}${gate.actualPalace !== pattern.palace ? `, thực cung là ${gate.actualPalace}` : ""}.`
      : stripEvidenceLabel(rule.evidenceLabel);
  }
  if (pattern.kind === "support-group") {
    const group = facts.supportGroups.find((item) => item.group === pattern.group && item.palace === pattern.palace);
    return group
      ? `Dấu hiệu tử vi nổi lên qua ${group.stars.slice(0, 3).join(", ")} tại ${pattern.palace}.`
      : stripEvidenceLabel(rule.evidenceLabel);
  }
  if (pattern.kind === "state") {
    const state = facts.states.find((item) => item.state === pattern.state);
    return state
      ? `Trong lá số, ${state.star} tại ${state.palace} đang ở trạng thái ${pattern.state}.`
      : stripEvidenceLabel(rule.evidenceLabel);
  }
  if (pattern.kind === "fate") {
    return pattern.fate === "dai-van"
      ? `Giai đoạn đang xét đi cùng đại vận ${facts.currentDecade.range} tại cung ${facts.currentDecade.palace}.`
      : stripEvidenceLabel(rule.evidenceLabel);
  }
  return stripEvidenceLabel(rule.evidenceLabel);
}

function matchRule(rule: InterpretationRule, facts: FreeOverviewFacts): ScoredInterpretationRule | null {
  const pattern = rule.pattern;
  let matched = false;
  let score = rule.priority;

  if (pattern.kind === "main-star-palace") {
    matched = facts.mainStarPalaces.some((item) => item.star === pattern.star && item.palace === pattern.palace);
    score += palaceWeight(pattern.palace);
  }
  if (pattern.kind === "gate") {
    matched = facts.gates.some((item) => item.gate === pattern.gate && item.palace === pattern.palace);
    score += palaceWeight(pattern.palace) + 8;
  }
  if (pattern.kind === "support-group") {
    matched = facts.supportGroups.some((item) => item.group === pattern.group && item.palace === pattern.palace);
    score += palaceWeight(pattern.palace);
  }
  if (pattern.kind === "state") {
    matched = facts.states.some((item) => item.state === pattern.state);
    score += pattern.state === "H" ? 12 : 4;
  }
  if (pattern.kind === "axis") {
    matched = true;
    score += pattern.palaces.some((palace) => palace === facts.currentDecade.palace) ? 12 : 0;
  }
  if (pattern.kind === "fate") {
    if (pattern.fate === "dai-van") matched = pattern.palace === facts.currentDecade.palace || (pattern.palace === "Thân" && facts.importantPalaces.some((palace) => palace.name === "Thân" && palace.actualName === facts.currentDecade.palace));
    if (pattern.fate === "yearly") matched = facts.yearlyActivatedPalaces.some((item) => item.palace === pattern.palace);
    score += palaceWeight(pattern.palace);
  }

  if (!matched) return null;
  return { ...rule, score, evidence: ruleEvidence(rule, facts) };
}

function selectRules(matches: ScoredInterpretationRule[]) {
  const sorted = [...matches].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const selected: ScoredInterpretationRule[] = [];
  const usedScopes = new Set<string>();
  const usedKinds = new Set<string>();

  for (const rule of sorted) {
    if (selected.length >= 5) break;
    const kind = rule.pattern.kind;
    if (selected.length < 3 && usedScopes.has(rule.scope)) continue;
    if (selected.length < 4 && usedKinds.has(kind)) continue;
    selected.push(rule);
    usedScopes.add(rule.scope);
    usedKinds.add(kind);
  }

  for (const rule of sorted) {
    if (selected.length >= 5) break;
    if (!selected.some((item) => item.key === rule.key)) selected.push(rule);
  }

  return selected;
}

export function buildFreeOverviewNarrativePlan(chart: TuViChart): FreeOverviewNarrativePlan {
  const facts = extractFreeOverviewFacts(chart);
  const allMatches = loadInterpretationRules()
    .map((rule) => matchRule(rule, facts))
    .filter((rule): rule is ScoredInterpretationRule => Boolean(rule));

  return {
    facts,
    selectedRules: selectRules(allMatches),
    allMatches,
  };
}

function readerText(value: string) {
  return value
    .replaceAll("Lợi thế là", "Bạn có điểm mạnh ở")
    .replaceAll("lợi thế là", "bạn có điểm mạnh ở")
    .replaceAll("Điểm mù là", "Điều dễ làm bạn vướng là")
    .replaceAll("điểm mù là", "điều dễ làm bạn vướng là")
    .replaceAll("Cạm bẫy là", "Bạn cần tránh việc")
    .replaceAll("cạm bẫy là", "bạn cần tránh việc")
    .replaceAll("người đọc", "bạn")
    .replaceAll("Người đọc", "Bạn")
    .replaceAll("người này", "bạn")
    .replaceAll("Người này", "Bạn")
    .replaceAll("mình", "bạn");
}

function normalizeText(value: string) {
  return readerText(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function hasDanglingEnding(sentence: string) {
  return /\b(vì|và|hoặc|nhưng|là|rằng|khi|nếu|mà)\.$/i.test(sentence.trim());
}

function splitSentences(value: string) {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && !hasDanglingEnding(sentence));
}

function completeSentences(value: string, maxSentences = 1, fallback = "Ý này cần được đọc cùng bối cảnh lá số để tránh kết luận vội.") {
  const sentences = splitSentences(value).slice(0, maxSentences);
  return sentences.length > 0 ? sentences.join(" ") : fallback;
}

function capitalizeSentence(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function practicalSummary(value: string) {
  const sentences = splitSentences(value);
  const practical =
    sentences.find((sentence) => /^Trong (đời sống|thực tế),/i.test(sentence)) ||
    sentences.find((sentence) => !/\sgiống\s/i.test(sentence)) ||
    sentences[0];
  if (!practical) return "Dấu hiệu này cần được đọc qua đời sống thực tế, không nên hiểu như một lời phán cố định.";
  return capitalizeSentence(practical.replace(/^Trong (đời sống|thực tế),\s*/i, ""));
}

function trimSentenceEnding(value: string) {
  return value.trim().replace(/[.!?]+$/g, "");
}

function lowerFirst(value: string) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function stripRuleLead(value: string) {
  return trimSentenceEnding(
    completeSentences(value, 1)
      .replace(/^(Bạn có điểm mạnh ở|bạn có điểm mạnh ở)\s+/i, "")
      .replace(/^(Điều dễ làm bạn vướng là|điều dễ làm bạn vướng là)\s+/i, "")
      .replace(/^(Bạn cần tránh việc|bạn cần tránh việc)\s+/i, ""),
  );
}

function naturalStrength(value: string) {
  const raw = stripRuleLead(value);
  if (!raw) return "Bạn có thể dùng điểm này để chọn việc quan trọng và giữ nhịp ổn định.";
  if (/^khả năng\s/i.test(raw)) return `Bạn có ${lowerFirst(raw)}.`;
  if (/^năng lực\s/i.test(raw)) return `Bạn có ${lowerFirst(raw)}.`;
  if (/^tránh\s/i.test(raw)) return `Bạn biết ${lowerFirst(raw)}.`;
  if (/^biến\s/i.test(raw)) return `Bạn biết ${lowerFirst(raw)}.`;
  if (/^tạo\s/i.test(raw)) return `Bạn có thể ${lowerFirst(raw)}.`;
  if (/^(biết|dám|tránh|nhìn|đọc|phát hiện|xây|tạo|mở|giữ|chỉnh|sửa|học)\s/i.test(raw)) {
    return `Bạn ${lowerFirst(raw)}.`;
  }
  return `Điểm sáng của bạn là ${lowerFirst(raw)}.`;
}

function naturalCaution(value: string) {
  const raw = stripRuleLead(value);
  if (!raw) return "Điều cần để ý là đừng quyết khi còn thiếu dữ kiện hoặc khi đang quá mệt.";
  if (/^quá\s/i.test(raw)) return `Nếu ${lowerFirst(raw)}, bạn dễ tự làm mình chậm lại.`;
  if (/^(dùng|xem|phá|giữ|nhận|chạy|tin|im lặng|để|tiếp tục|phản ứng|khép|phủ nhận)\s/i.test(raw)) {
    return `Điều cần để ý là bạn có thể ${lowerFirst(raw)}.`;
  }
  return `Điều cần để ý là ${lowerFirst(raw)}.`;
}

function normalizedFingerprint(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueRules(rules: ScoredInterpretationRule[]) {
  const seenKeys = new Set<string>();
  const seenIdeas = new Set<string>();
  const output: ScoredInterpretationRule[] = [];

  for (const rule of rules) {
    const idea = normalizedFingerprint(`${rule.title} ${completeSentences(rule.summary, 1)}`);
    if (seenKeys.has(rule.key) || seenIdeas.has(idea)) continue;
    seenKeys.add(rule.key);
    seenIdeas.add(idea);
    output.push(rule);
  }

  return output;
}

function toInsight(rule: ScoredInterpretationRule, topic: string): FreeOverviewInsight {
  return {
    key: rule.key,
    topic,
    title: normalizeText(rule.title),
    summary: practicalSummary(rule.summary),
    strength: naturalStrength(rule.strengthText),
    caution: naturalCaution(rule.cautionText),
    advice: completeSentences(rule.lifeAdviceText, 1, "Nói đời thường, phần này nhắc bạn nhìn kỹ trách nhiệm, thời gian và sức lực trước khi nhận thêm việc."),
    evidence: completeSentences(rule.evidence, 1, "Lá số cho thấy đây là một vùng cần đọc kỹ hơn."),
    teaserQuestion: completeSentences(rule.teaserQuestion, 1, "Nếu đọc sâu hơn, bạn cần biết lựa chọn nào nên đi tiếp và lựa chọn nào nên chậm lại?"),
    score: rule.score,
  };
}

function selectInsight(
  pool: ScoredInterpretationRule[],
  usedKeys: Set<string>,
  topic: string,
  predicate: (rule: ScoredInterpretationRule) => boolean,
  fallbackIndex: number,
) {
  const preferred = pool.find((rule) => !usedKeys.has(rule.key) && predicate(rule));
  const fallback = preferred || pool.find((rule) => !usedKeys.has(rule.key)) || pool[fallbackIndex % pool.length];
  usedKeys.add(fallback.key);
  return toInsight(fallback, topic);
}

function buildInsightSet(plan: FreeOverviewNarrativePlan) {
  const pool = uniqueRules([...plan.selectedRules, ...plan.allMatches]).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const usedKeys = new Set<string>();

  const primaryKey = plan.selectedRules[0]?.key;
  const secondaryKey = plan.selectedRules[1]?.key;
  const tertiaryKey = plan.selectedRules[2]?.key;

  const primary = selectInsight(pool, usedKeys, "core", (rule) => rule.key === primaryKey, 0);
  const secondary = selectInsight(pool, usedKeys, "core", (rule) => rule.key === secondaryKey, 1);
  const tertiary = selectInsight(pool, usedKeys, "core", (rule) => rule.key === tertiaryKey, 2);
  const career = selectInsight(pool, usedKeys, "career", (rule) => rule.scope === "CAREER", 3);
  const money = selectInsight(pool, usedKeys, "money", (rule) => rule.scope === "MONEY", 4);
  const relationship = selectInsight(pool, usedKeys, "relationship", (rule) => rule.scope === "RELATIONSHIP", 5);
  const health = selectInsight(pool, usedKeys, "health", (rule) => rule.scope === "HEALTH", 6);
  const year = selectInsight(pool, usedKeys, "year", (rule) => rule.scope === "YEAR", 7);
  const additional = pool
    .filter((rule) => !usedKeys.has(rule.key))
    .slice(0, 6)
    .map((rule) => {
      usedKeys.add(rule.key);
      return toInsight(rule, "additional");
    });

  return { primary, secondary, tertiary, career, money, relationship, health, year, additional };
}

function insightParagraph(insight: FreeOverviewInsight) {
  return `${insight.summary} ${insight.evidence} ${insight.strength} ${insight.caution}`;
}

function removeRepeatedSentences(content: string) {
  const seen = new Set<string>();
  return content
    .split(/(?<=[.!?])(\s+)/)
    .reduce((parts, part, index, chunks) => {
      if (index % 2 === 1) return parts;
      const separator = chunks[index + 1] || "";
      const sentence = part.trim();
      if (!sentence) return parts;
      const fingerprint = normalizedFingerprint(sentence);
      if (sentence.split(/\s+/).length >= 9 && seen.has(fingerprint)) return parts;
      seen.add(fingerprint);
      parts.push(`${part}${separator}`);
      return parts;
    }, [] as string[])
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ruleForScope(rules: ScoredInterpretationRule[], scope: string, fallbackIndex: number) {
  return rules.find((rule) => rule.scope === scope) || rules[fallbackIndex % rules.length];
}

function compactText(value: string, maxLength = 135) {
  if (value.length <= maxLength) return value;
  const sentences = splitSentences(value);
  const sentence = sentences.find((item) => item.length <= maxLength) || sentences[0];
  return sentence || value.slice(0, maxLength).trim();
}

function ruleParagraph(rule: ScoredInterpretationRule) {
  return `${compactText(readerText(rule.summary), 180)} ${rule.evidence} ${compactText(readerText(rule.strengthText), 120)} ${compactText(readerText(rule.cautionText), 120)}`;
}

function highlightRule(label: string, rule: ScoredInterpretationRule, maxLength = 260) {
  return `**${label}:** ${rule.title}. ${compactText(readerText(rule.summary), maxLength)} ${rule.evidence}`;
}

function compose(plan: FreeOverviewNarrativePlan, chart: TuViChart) {
  if (plan.allMatches.length >= 0) return composeSmooth(plan, chart);
  const [primary, secondary, tertiary] = plan.selectedRules;
  const career = ruleForScope(plan.selectedRules, "CAREER", 1);
  const money = ruleForScope(plan.selectedRules, "MONEY", 2);
  const relationship = ruleForScope(plan.selectedRules, "RELATIONSHIP", 3);
  const health = ruleForScope(plan.selectedRules, "HEALTH", 4);
  const year = ruleForScope(plan.selectedRules, "YEAR", 0);
  const facts = plan.facts;
  const isYoung = facts.age <= 21;
  const contextLine = isYoung
    ? "Ở tuổi này, hãy hiểu các chữ như tiền bạc, hợp tác, trách nhiệm theo nghĩa rất gần: tiền tiêu vặt, học phí, việc part-time, bài tập nhóm, câu lạc bộ và chọn ngành."
    : "Ở giai đoạn trưởng thành, hãy hiểu các chữ như tiền bạc, hợp tác, trách nhiệm theo nghĩa rất thực: vai trò công việc, ngân sách, gia đình, ranh giới cam kết và nhịp nghỉ.";

  return `## Tín hiệu nổi bật của lá số
${chart.input.fullName}, bản đọc nhanh này không mở đầu bằng điểm số hay lời phán chung. Nó đi thẳng vào **điểm cần đọc sâu** đầu tiên: ${primary.title}. ${readerText(primary.summary)} ${primary.evidence}

**Điểm chính:** ${readerText(primary.strengthText)} Khi ghép với ${facts.menhThanLabel}, bạn nên đọc lá số này như một bản đồ về nhịp sống: điểm nào nên tin vào năng lực của bạn, điểm nào nên đi chậm, và điểm nào cần kiểm chứng trước khi quyết.

${compactText(readerText(primary.lifeAdviceText), 180)} ${facts.lifeContext} ${contextLine}

## Điểm đáng chú ý nhất
${highlightRule("Cần chú ý", secondary)}

${ruleParagraph(secondary)}

${highlightRule("Điểm chính", tertiary)}

${readerText(tertiary.cautionText)} Nếu cùng một vấn đề lặp lại nhiều lần, lá số đang nhắc bạn đọc nguyên nhân. Đừng chỉ sửa phần ngọn.

## Công việc và tài chính
${highlightRule("Điểm chính", career)}

Về công việc, ${ruleParagraph(career)} Với tiền bạc và nguồn lực, ${ruleParagraph(money)}

**Cần chú ý:** tiền không chỉ là số dư. Nó còn là sức lực, thời gian, khả năng tập trung và các cam kết bạn đã nhận.

${isYoung ? "Với bạn trẻ, hãy đọc phần này qua tiền tiêu vặt, học phí, part-time, bài tập nhóm và chọn ngành." : "Với người đã đi làm, hãy đọc phần này qua vai trò, thu nhập, trách nhiệm, ngân sách, hợp tác và gia đình."}

## Tình cảm và quan hệ
${highlightRule("Điểm chính", relationship)}

Trong quan hệ, ${ruleParagraph(relationship)} Điều cần tránh là giữ hòa khí bằng cách im lặng quá lâu. Bạn cần biết mối quan hệ nào làm bạn vững hơn, mối quan hệ nào làm bạn phải gồng.

**Cần chú ý:** tình cảm còn là cách hai bên chia trách nhiệm, giữ lời hứa và xử lý lúc có áp lực.

## Sức khỏe và nhịp sống
Về sức khỏe, chỉ nên đọc phần này như nhịp sống và tinh thần, không thay thế tư vấn y khoa. ${highlightRule("Cần chú ý", health)}

${ruleParagraph(health)}

Bạn nên quan sát tín hiệu nhỏ: ngủ không sâu, nghỉ mà vẫn mệt, dễ cáu, khó tập trung. Khi quá tải, hãy giảm một việc, nói rõ một ranh giới và giữ lại thời gian hồi sức.

## Vận năm ${chart.input.viewYear}
Năm ${chart.input.viewYear} cần đọc cùng đại vận ${facts.currentDecade.range} tại ${facts.currentDecade.palace}. ${highlightRule("Điểm chính", year)}

${ruleParagraph(year)}

**Nên đọc tiếp:** bản chi tiết đang được viết tiếp dưới nền để làm rõ công việc, tiền bạc, tình cảm và vận năm. Bản miễn phí này chỉ chỉ ra vấn đề là gì và vì sao nó đáng chú ý. Phần chuyên sâu mới nối các cung, sao, trạng thái sao và vận hạn thành lộ trình cụ thể hơn.

Việc quan trọng không nên quyết lúc vội hoặc mệt. Điều gì giúp rõ hơn, khỏe hơn, bớt rối hơn thì làm trước; điều gì chỉ tăng áp lực thì chậm lại.

## Câu hỏi mở trước khi đi sâu
- ${readerText(primary.teaserQuestion)}
- ${readerText(secondary.teaserQuestion)}
- ${readerText(tertiary.teaserQuestion)}
- Trong năm ${chart.input.viewYear}, lựa chọn nào cần đọc kỹ trước khi bạn bước tiếp?`;
}

function normalizeWordCount(content: string, plan: FreeOverviewNarrativePlan) {
  if (plan.allMatches.length >= 0) return normalizeWordCountSmooth(content, plan);
  let output = content.trim();
  const additions = plan.allMatches.slice(0, 8).map(
    (rule) => `\n\n**Điểm bổ sung:** ${rule.title}. ${compactText(readerText(rule.strengthText), 110)} ${compactText(readerText(rule.cautionText), 110)} ${rule.evidence}`,
  );
  let index = 0;
  while (countWords(output) < 1400 && index < additions.length) {
    output += additions[index];
    index += 1;
  }
  return output;
}

function composeLeadMagnet(plan: FreeOverviewNarrativePlan, chart: TuViChart) {
  const { primary, secondary, career, money, relationship, health, year } = buildInsightSet(plan);
  const facts = plan.facts;
  const isYoung = facts.age <= 21;
  const lifeFrame = isYoung
    ? "Với độ tuổi này, hãy hiểu các chữ như công việc, tiền bạc và trách nhiệm theo nghĩa rất gần: chọn ngành, lịch học, bài tập nhóm, câu lạc bộ, tiền tiêu vặt, học phí và việc part-time."
    : "Ở giai đoạn trưởng thành, các tín hiệu này nên được đọc qua vai trò công việc, tiền bạc, gia đình, trách nhiệm thân thiết, nhịp nghỉ và những quyết định dài hạn.";
  const paidFocus = isYoung
    ? "lộ trình học tập, lựa chọn môi trường, cách giữ năng lượng và các mốc nên đi chậm trong năm"
    : "lộ trình công việc, tiền bạc, quan hệ thân thiết và các mốc cần kiểm chứng trước khi quyết";

  return removeRepeatedSentences(`# Bản đọc thử lá số tử vi: Bức tranh tổng quan & những chỉ báo cốt lõi
${chart.input.fullName} (${facts.menhThanLabel})

Bản đọc thử này không bắt đầu bằng lời phán định mệnh. Nó là **một tấm bản đồ** giúp bạn nhìn lại cách mình suy nghĩ, giữ an toàn và xử lý áp lực.

Điểm quan trọng nhất của bản miễn phí là giúp bạn nhận ra **chuyện gì đang lặp lại trong đời sống**. Bản Luận Giải Chuyên Sâu sẽ đi tiếp vào phần thực tế hơn: nên ưu tiên điều gì, việc nào đang làm bạn hao sức và năm ${chart.input.viewYear} nên đi nhanh hay chậm ở đâu.

## 1. Vì sao bạn hay tự kiểm tra trước khi tin: ${primary.title}
${primary.summary} ${primary.evidence} ${primary.strength}

Bạn không phải kiểu dễ tin ngay chỉ vì người khác nói hay. Trước khi quyết, bạn thường âm thầm hỏi: điều này có đáng tin không, ai thật sự chịu trách nhiệm, mình có đang gánh quá nhiều không. ${primary.caution}

${primary.advice} ${lifeFrame} **Đây là đoạn dễ tạo cảm giác “đúng với mình”**: không phải vì lá số nói bạn tốt hay xấu, mà vì nó gọi đúng kiểu áp lực bạn hay tự giữ trong lòng.

## 2. Công việc: cần rõ vai, rõ luật chơi: ${career.title}
${career.summary} ${career.evidence} ${career.strength}

Bạn không hợp với kiểu làm việc mù mờ hoặc giao hết quyền kiểm soát cho người khác. Khi vai trò, trách nhiệm và giá trị thật chưa rõ, bạn dễ vừa làm vừa nghi ngờ, rồi tự kéo thêm việc về phía mình để mọi thứ “chắc” hơn.

Trong tử vi, lớp nghĩa này còn liên quan đến **${secondary.title}**. ${insightParagraph(secondary)} Điều này không phải lời phán tốt xấu. Nó chỉ gợi ý rằng bạn nên nhìn kỹ: mình đang thiếu môi trường phù hợp, thiếu người chia trách nhiệm, hay thiếu một nhịp đi đủ chắc để biến năng lực thành kết quả.

## 3. Tiền bạc: giữ an toàn nhưng đừng tự khóa mình: ${money.title}
${money.summary} ${money.evidence} ${money.strength} ${money.caution}

Tài chính trong lá số này không chỉ là số tiền đang có. Nó còn là thời gian, sức lực, sự tập trung và mức độ tự do. Có người hao vì tiêu xài bốc đồng; còn bạn có thể hao kín hơn: nhận việc không đúng giá trị, ôm trách nhiệm thay người khác, hoặc giữ một lựa chọn quá lâu vì sợ đổi hướng sẽ mất an toàn.

Nếu đọc sâu hơn, phần tiền bạc sẽ không dừng ở nhận xét chung. Nó cần nối cung Tài Bạch, cung Quan Lộc, đại vận và vận năm để trả lời câu hỏi thực tế hơn: lúc nào nên giữ, lúc nào nên mở, việc nào chỉ làm bạn bận hơn nhưng không làm bạn tự do hơn.

## 4. Quan hệ và nhịp sống: đừng để mình thành người gánh hết: ${relationship.title}
${relationship.summary} ${relationship.evidence} ${relationship.strength} ${relationship.caution}

Một lớp áp lực khác đến từ gia đình, tình cảm và trách nhiệm thân thiết. Bạn có thể rất để ý cảm giác của người khác, tính trước rủi ro cho người khác, hoặc tự đứng vào vai người giữ nhịp. Điều này tạo uy tín, nhưng cũng dễ làm năng lượng tinh thần bị rút dần.

Về sức khỏe và nhịp sống, dấu hiệu cần quan sát là **${health.title}**. ${insightParagraph(health)} Phần này không thay thế tư vấn y khoa. Nó chỉ nhắc rằng khi áp lực kéo dài, cơ thể thường báo trước bằng những tín hiệu nhỏ: ngủ không sâu, nghỉ mà vẫn mệt, dễ cáu, khó tập trung hoặc không còn muốn bắt đầu việc mới.

Năm ${chart.input.viewYear} cần đọc cùng đại vận ${facts.currentDecade.range} tại ${facts.currentDecade.palace}. Vùng vận đang mở ra là **${year.title}**. ${insightParagraph(year)} Vận hạn không phải bản án; nó chỉ cho biết vùng nào nên chuẩn bị kỹ, vùng nào có thể đi xa hơn nếu bạn đủ dữ kiện và sức lực.

## Mở khóa bản luận giải chuyên sâu
Nếu phần đọc thử này làm bạn thấy có vài điều đúng với mình, Bản Luận Giải Chuyên Sâu sẽ đi tiếp từ những điểm đã chạm ở trên. Bản chuyên sâu sẽ đi tiếp vào ${paidFocus}, để bạn nhìn rõ hơn nên ưu tiên điều gì và điều gì đang âm thầm làm mình hao sức.

Trong Bản Luận Giải Chuyên Sâu, bạn sẽ được mở khóa:

- **Lộ trình trọng tâm năm ${chart.input.viewYear}**: vùng nào nên ưu tiên, vùng nào nên đi chậm, vùng nào cần kiểm chứng trước khi quyết.
- **Chiến lược đọc công việc và nguồn lực**: vì sao bạn dễ ôm việc, dễ chậm quyết hoặc dễ mất sức ở những cam kết tưởng như nhỏ.
- **Giải mã quan hệ và trách nhiệm thân thiết**: đâu là điểm nâng đỡ, đâu là nơi bạn đang gánh thay quá nhiều.
- **Bản đồ hành động cá nhân hóa**: nối cung, sao, trạng thái và vận thành một hướng đi rõ hơn.

Lá số đã vạch ra những đường nét chính. Việc đi nhanh, đi chắc hay dừng lại đúng lúc cần một bản đồ đầy đủ hơn để bạn không quyết chỉ bằng cảm giác nhất thời.`);
}

function composeSmooth(plan: FreeOverviewNarrativePlan, chart: TuViChart) {
  return composeLeadMagnet(plan, chart);
  const { primary, secondary, tertiary, career, money, relationship, health, year } = buildInsightSet(plan);
  const facts = plan.facts;
  const isYoung = facts.age <= 21;
  const contextLine = isYoung
    ? "Ở tuổi này, hãy hiểu các chữ như tiền bạc, hợp tác, trách nhiệm theo nghĩa rất gần: tiền tiêu vặt, học phí, việc part-time, bài tập nhóm, câu lạc bộ và chọn ngành."
    : "Ở giai đoạn trưởng thành, hãy hiểu các chữ như tiền bạc, hợp tác, trách nhiệm theo nghĩa rất thực: vai trò công việc, ngân sách, gia đình, ranh giới cam kết và nhịp nghỉ.";

  return removeRepeatedSentences(`## Tín hiệu nổi bật của lá số
${chart.input.fullName}, bản đọc nhanh này không mở đầu bằng điểm số hay lời phán chung. Nó đi thẳng vào **điểm cần đọc sâu** đầu tiên: **${primary.title}**. ${primary.summary} ${primary.evidence}

${primary.strength} Khi ghép với ${facts.menhThanLabel}, bạn nên đọc lá số này như một bản đồ về nhịp sống: điểm nào nên tin vào năng lực của bạn, điểm nào nên đi chậm, và điểm nào cần kiểm chứng trước khi quyết. **Điều quan trọng không nằm ở việc nghe một lời phán chắc chắn**, mà nằm ở việc nhận ra vùng nào của đời sống đang cần được soi kỹ hơn.

${primary.advice} ${facts.lifeContext} ${contextLine}

## Điểm đáng chú ý nhất
Vùng thứ hai cần đọc chậm là **${secondary.title}**. ${insightParagraph(secondary)}

Khi một dấu hiệu xuất hiện ở vùng trọng yếu, nó không nói rằng bạn chắc chắn sẽ gặp một việc cố định. Nó nói rằng chủ đề đó dễ lặp lại dưới nhiều hình thức: khi thì là quyết định công việc, khi thì là cách dùng tiền, khi thì là một mối quan hệ khiến bạn phải cân nhắc lại giới hạn của mình.

Một lớp nghĩa khác là **${tertiary.title}**. ${insightParagraph(tertiary)}

Nếu cùng một vấn đề lặp lại nhiều lần, lá số đang nhắc bạn đọc nguyên nhân. Đừng chỉ sửa phần ngọn. **Bản miễn phí chỉ mở ra “vì sao chuyện này đáng chú ý”**; phần chuyên sâu mới nối các cung, sao, trạng thái và vận thành một lộ trình cụ thể hơn.

## Công việc và tài chính
Ở mảng công việc, dấu hiệu nổi bật là **${career.title}**. ${career.summary} ${career.evidence} ${career.strength}

Với tiền bạc và nguồn lực, điểm nên nhìn sâu là **${money.title}**. ${money.summary} ${money.evidence} ${money.strength} ${money.caution}

Tư duy tài chính trong lá số không nên hiểu hẹp là kiếm được bao nhiêu. Tiền còn là sức lực, thời gian, khả năng tập trung và các cam kết bạn đã nhận. Nếu bạn thấy mình hao hụt, hãy kiểm tra không chỉ khoản chi, mà cả việc nào đang lấy quá nhiều năng lượng, mối hợp tác nào chưa rõ trách nhiệm, và cơ hội nào nghe hấp dẫn nhưng thiếu điều kiện đo được.

${isYoung ? "Với bạn trẻ, hãy đọc phần này qua tiền tiêu vặt, học phí, part-time, bài tập nhóm và chọn ngành." : "Với người đã đi làm, hãy đọc phần này qua vai trò, thu nhập, trách nhiệm, ngân sách, hợp tác và gia đình."} **Điểm nên giữ là làm rõ phạm vi trước khi nhận thêm việc**, vì nhiều lá số không hao vì tiêu xài bốc đồng, mà hao vì ôm quá nhiều thứ cùng lúc.

## Tình cảm và quan hệ
Trong tình cảm và quan hệ, điểm cần đọc kỹ là **${relationship.title}**. ${insightParagraph(relationship)}

Điều cần tránh là giữ hòa khí bằng cách im lặng quá lâu. Bạn cần biết mối quan hệ nào làm bạn vững hơn, mối quan hệ nào làm bạn phải gồng. Một quan hệ tốt không chỉ là có cảm xúc tốt, mà còn là cách hai bên chia trách nhiệm, giữ lời hứa và xử lý lúc có áp lực.

Nếu bạn đang đứng trước một lựa chọn tình cảm, bản chuyên sâu sẽ hữu ích ở chỗ nó không chỉ nói “hợp hay không hợp”. Nó đọc sâu hơn: điều gì khiến bạn dễ mềm lòng, điều gì khiến bạn phòng thủ, và khi nào nên nói rõ ranh giới thay vì chờ người khác tự hiểu.

## Sức khỏe và nhịp sống
Về sức khỏe, chỉ nên đọc phần này như nhịp sống và tinh thần, không thay thế tư vấn y khoa. Dấu hiệu nên quan sát là **${health.title}**. ${insightParagraph(health)}

Bạn nên quan sát tín hiệu nhỏ: ngủ không sâu, nghỉ mà vẫn mệt, dễ cáu, khó tập trung. Khi quá tải, hãy giảm một việc, nói rõ một ranh giới và giữ lại thời gian hồi sức. **Đừng đợi đến lúc cạn năng lượng mới điều chỉnh**, vì nhiều vấn đề trong lá số bắt đầu từ nhịp sống lệch chứ không phải từ một biến cố lớn.

## Vận năm ${chart.input.viewYear}
Năm ${chart.input.viewYear} cần đọc cùng đại vận ${facts.currentDecade.range} tại ${facts.currentDecade.palace}. Vùng vận đang mở ra là **${year.title}**. ${insightParagraph(year)}

Vận không phải một lời phán cố định. Nó giống như bản đồ thời tiết: cho biết vùng nào nên mang áo mưa, vùng nào có thể đi xa, và vùng nào cần chờ thêm tín hiệu. Vì vậy, việc quan trọng không nên quyết lúc vội hoặc mệt. Điều gì giúp rõ hơn, khỏe hơn, bớt rối hơn thì làm trước; điều gì chỉ tăng áp lực thì chậm lại.

Phần bản chi tiết đang được viết tiếp dưới nền để làm rõ công việc, tiền bạc, tình cảm và vận năm. Bản miễn phí này chỉ chỉ ra vấn đề là gì và vì sao nó đáng chú ý. Phần chuyên sâu mới nối các cung, sao, trạng thái sao và vận hạn thành lộ trình cụ thể hơn.

## Câu hỏi mở trước khi đi sâu
- ${primary.teaserQuestion}
- ${secondary.teaserQuestion}
- ${tertiary.teaserQuestion}
- Trong năm ${chart.input.viewYear}, lựa chọn nào cần đọc kỹ trước khi bạn bước tiếp?`);
}

function normalizeWordCountSmooth(content: string, plan: FreeOverviewNarrativePlan) {
  let output = removeRepeatedSentences(content.trim());
  const usedTitles = new Set(
    Array.from(output.matchAll(/\*\*([^*]+)\*\*/g), (match) => normalizedFingerprint(match[1] || "")),
  );
  const additions = uniqueRules(plan.allMatches)
    .filter((rule) => !usedTitles.has(normalizedFingerprint(rule.title)))
    .slice(0, 8)
    .map((rule) => {
      const insight = toInsight(rule, "supplement");
      return `\n\n${insight.title} cũng là một dấu hiệu nên giữ trong đầu. ${insight.summary} ${insight.evidence} Khi đọc sâu hơn, phần này sẽ giúp bạn biết nên giữ nhịp, mở rộng hay đặt lại giới hạn.`;
    });
  let index = 0;
  while (countWords(output) < 1400 && index < additions.length) {
    const candidate = removeRepeatedSentences(`${output}${additions[index]}`);
    if (countWords(candidate) > 1650) break;
    output = candidate;
    index += 1;
  }

  const strategicBridges = [
    "\n\nĐiểm cần giữ lại sau bản đọc thử này là cách bạn ra quyết định khi dữ kiện chưa hoàn toàn rõ. Một lá số có thể chỉ ra áp lực, nhưng giá trị thực tế nằm ở việc biến áp lực đó thành hệ thống: việc nào đo được thì đo, việc nào cần người cùng chịu trách nhiệm thì nói rõ, việc nào chỉ làm bạn mất sức mà không tạo giá trị thì nên đặt lại giới hạn.",
    "\n\nNếu chỉ đọc một đoạn rồi kết luận ngay, bạn sẽ dễ bỏ qua phần quan trọng nhất: mỗi tín hiệu cần được nối với hoàn cảnh hiện tại của bạn. Vì vậy, hãy xem bản miễn phí như lớp bản đồ đầu tiên; nó giúp nhận diện khu vực cần soi kỹ, còn bản chuyên sâu mới trả lời nên đi nhanh, đi chậm hay dừng lại ở điểm nào.",
  ];
  let bridgeIndex = 0;
  while (countWords(output) < 1400 && bridgeIndex < strategicBridges.length) {
    const candidate = removeRepeatedSentences(`${output}${strategicBridges[bridgeIndex]}`);
    if (countWords(candidate) > 1650) break;
    output = candidate;
    bridgeIndex += 1;
  }

  return output;
}

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const plan = buildFreeOverviewNarrativePlan(chart);
  return normalizeWordCount(compose(plan, chart), plan);
}
