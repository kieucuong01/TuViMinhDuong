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

function ruleEvidence(rule: InterpretationRule, facts: FreeOverviewFacts) {
  const pattern = rule.pattern;
  if (pattern.kind === "main-star-palace") {
    const fact = facts.mainStarPalaces.find((item) => item.star === pattern.star && item.palace === pattern.palace);
    return fact ? `Căn cứ: ${pattern.star}${fact.state ? ` (${fact.state})` : ""} tại cung ${pattern.palace} (${fact.branch}).` : rule.evidenceLabel;
  }
  if (pattern.kind === "gate") {
    const gate = facts.gates.find((item) => item.gate === pattern.gate && item.palace === pattern.palace);
    return gate ? `Căn cứ: ${pattern.gate} án tại ${pattern.palace}${gate.actualPalace !== pattern.palace ? `, thực cung ${gate.actualPalace}` : ""}.` : rule.evidenceLabel;
  }
  if (pattern.kind === "support-group") {
    const group = facts.supportGroups.find((item) => item.group === pattern.group && item.palace === pattern.palace);
    return group ? `Căn cứ: ${group.stars.slice(0, 3).join(", ")} tại ${pattern.palace}.` : rule.evidenceLabel;
  }
  if (pattern.kind === "state") {
    const state = facts.states.find((item) => item.state === pattern.state);
    return state ? `Căn cứ: ${state.star} tại ${state.palace} có trạng thái ${pattern.state}.` : rule.evidenceLabel;
  }
  if (pattern.kind === "fate") {
    return pattern.fate === "dai-van"
      ? `Căn cứ: đại vận ${facts.currentDecade.range} tại cung ${facts.currentDecade.palace}.`
      : rule.evidenceLabel;
  }
  return rule.evidenceLabel;
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

function ruleForScope(rules: ScoredInterpretationRule[], scope: string, fallbackIndex: number) {
  return rules.find((rule) => rule.scope === scope) || rules[fallbackIndex % rules.length];
}

function compactText(value: string, maxLength = 135) {
  if (value.length <= maxLength) return value;
  const sliced = value.slice(0, maxLength);
  return `${sliced.slice(0, Math.max(0, sliced.lastIndexOf(" ")))}.`;
}

function readerText(value: string) {
  return value
    .replaceAll("người đọc", "bạn")
    .replaceAll("Người đọc", "Bạn")
    .replaceAll("người này", "bạn")
    .replaceAll("Người này", "Bạn")
    .replaceAll("mình", "bạn");
}

function ruleParagraph(rule: ScoredInterpretationRule) {
  return `${compactText(readerText(rule.summary), 180)} ${rule.evidence} ${compactText(readerText(rule.strengthText), 120)} ${compactText(readerText(rule.cautionText), 120)}`;
}

function highlightRule(label: string, rule: ScoredInterpretationRule, maxLength = 260) {
  return `**${label}:** ${rule.title}. ${compactText(readerText(rule.summary), maxLength)} ${rule.evidence}`;
}

function compose(plan: FreeOverviewNarrativePlan, chart: TuViChart) {
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

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const plan = buildFreeOverviewNarrativePlan(chart);
  return normalizeWordCount(compose(plan, chart), plan);
}
