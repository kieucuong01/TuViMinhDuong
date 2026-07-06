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

function viewerAddress(chart: TuViChart) {
  const age = chartAge(chart);
  if (age >= 55) return chart.input.gender === "female" ? "cô" : "chú";
  if (age >= 35) return chart.input.gender === "female" ? "chị" : "anh";
  return "bạn";
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
    address: viewerAddress(chart),
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

function compose(plan: FreeOverviewNarrativePlan, chart: TuViChart) {
  const [primary, secondary, tertiary] = plan.selectedRules;
  const career = ruleForScope(plan.selectedRules, "CAREER", 1);
  const money = ruleForScope(plan.selectedRules, "MONEY", 2);
  const relationship = ruleForScope(plan.selectedRules, "RELATIONSHIP", 3);
  const health = ruleForScope(plan.selectedRules, "HEALTH", 4);
  const year = ruleForScope(plan.selectedRules, "YEAR", 0);
  const facts = plan.facts;
  const isYoung = facts.age <= 21;

  return `## Tín hiệu nổi bật của lá số
${chart.input.fullName}, điểm cần đọc sâu đầu tiên không nằm ở một lời phán chung, mà ở ${primary.title}. ${compactText(primary.summary)} ${primary.evidence} Khi ghép với ${facts.menhThanLabel}, lá số cho thấy một nhịp sống cần hiểu đúng trọng tâm trước khi vội kết luận tốt xấu.

${compactText(primary.lifeAdviceText)} ${facts.lifeContext} Bản đọc nhanh này chỉ mở đúng điểm cần đọc sâu: đâu là năng lực nên tin, đâu là vùng nên đi chậm.

## Mỏ neo
- **Trọng tâm chính: ${primary.title}** — ${compactText(primary.strengthText, 120)}
- **Điểm cần giữ nhịp: ${secondary.title}** — ${compactText(secondary.cautionText, 120)}
- **Năm ${chart.input.viewYear}: đọc cùng vận hiện tại** — ${year.evidence}

## Điểm đáng chú ý nhất
${tertiary.title} là tín hiệu không nên bỏ qua. ${compactText(tertiary.summary)} ${tertiary.evidence}

${compactText(tertiary.cautionText)} Nếu cùng một vấn đề lặp lại nhiều lần, lá số đang nhắc nên đọc nguyên nhân chứ không chỉ sửa phần ngọn.

## Công việc và tài chính
Về công việc, ${compactText(career.summary)} ${career.evidence} Với tiền bạc và nguồn lực, ${compactText(money.summary)} ${money.evidence} ${isYoung ? "Ở tuổi này, tiền bạc là tiền tiêu vặt, học phí, part-time; cộng tác là bài tập nhóm cần rõ phần việc." : "Ở giai đoạn trưởng thành, tiền bạc đi cùng vai trò, trách nhiệm, ngân sách và cam kết dài hạn."}

Điểm nên phát huy là chọn việc có điều kiện rõ: mình làm gì, được gì, mất gì. Khi điều kiện còn mờ, nên thử nhỏ trước rồi mới mở rộng.

## Tình cảm và quan hệ
Trong quan hệ, ${compactText(relationship.summary)} ${relationship.evidence} ${compactText(relationship.lifeAdviceText)} Điều cần tránh là giữ hòa khí bằng cách im lặng quá lâu.

## Sức khỏe và nhịp sống
Về sức khỏe, chỉ nên đọc như nhịp sống và tinh thần, không thay thế tư vấn y khoa. ${compactText(health.summary)} ${health.evidence} ${compactText(health.cautionText)}

## Vận năm ${chart.input.viewYear}
Năm ${chart.input.viewYear} cần đọc cùng đại vận ${facts.currentDecade.range} tại ${facts.currentDecade.palace}. ${compactText(year.summary)} ${year.evidence} bản chi tiết đang được viết tiếp dưới nền để làm rõ công việc, tiền bạc, tình cảm và vận năm.

Việc quan trọng không nên quyết lúc vội, mệt hoặc muốn làm vừa lòng người khác. Điều gì giúp rõ hơn, khỏe hơn, bớt rối hơn thì làm trước.

## Câu hỏi mở trước khi đi sâu
- ${primary.teaserQuestion}
- ${secondary.teaserQuestion}
- ${tertiary.teaserQuestion}
- Trong năm ${chart.input.viewYear}, lựa chọn nào cần đọc kỹ trước khi ${facts.address} bước tiếp?`;
}

function normalizeWordCount(content: string, plan: FreeOverviewNarrativePlan) {
  let output = content.trim();
  const additions = plan.selectedRules.map(
    (rule) => `\n\nĐiểm bổ sung cần nhớ: ${rule.strengthText} ${rule.cautionText} ${rule.evidence}`,
  );
  let index = 0;
  while (countWords(output) < 800 && index < additions.length) {
    output += additions[index];
    index += 1;
  }
  return output;
}

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const plan = buildFreeOverviewNarrativePlan(chart);
  return normalizeWordCount(compose(plan, chart), plan);
}
