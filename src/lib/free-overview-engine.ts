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

export type FreeOverviewCluster = {
  key: string;
  title: string;
  primary: ScoredInterpretationRule;
  support?: ScoredInterpretationRule;
};

export type FreeOverviewNarrativePlan = {
  facts: FreeOverviewFacts;
  clusters: FreeOverviewCluster[];
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

function rulePalaces(rule: ScoredInterpretationRule) {
  if ("palace" in rule.pattern) return [rule.pattern.palace];
  if (rule.pattern.kind === "axis") return rule.pattern.palaces;
  return [];
}

const CLUSTER_SPECS = [
  {
    key: "identity",
    title: "Khí chất và cách ra quyết định",
    scopes: ["IDENTITY", "AXIS"],
    palaces: ["Mệnh", "Thân"],
  },
  {
    key: "resources",
    title: "Công việc và nguồn lực",
    scopes: ["CAREER", "MONEY"],
    palaces: ["Quan Lộc", "Tài Bạch", "Thiên Di"],
  },
  {
    key: "relationships",
    title: "Quan hệ và nhịp sống",
    scopes: ["RELATIONSHIP", "HEALTH"],
    palaces: ["Phu Thê", "Phúc Đức", "Tật Ách"],
  },
  {
    key: "current",
    title: "Vận hiện tại",
    scopes: ["YEAR"],
    palaces: IMPORTANT_INTERPRETATION_PALACES,
  },
] as const;

function clusterScore(rule: ScoredInterpretationRule, spec: (typeof CLUSTER_SPECS)[number]) {
  const scopeIndex = spec.scopes.indexOf(rule.scope as never);
  const palaceMatch = rulePalaces(rule).some((palace) => spec.palaces.includes(palace as never));
  const primaryPattern = rule.pattern.kind === "main-star-palace" || rule.pattern.kind === "fate";
  return rule.score + (scopeIndex === 0 ? 18 : 8) + (palaceMatch ? 14 : 0) + (primaryPattern ? 4 : 0);
}

function selectClusters(matches: ScoredInterpretationRule[]) {
  const used = new Set<string>();
  const clusters: FreeOverviewCluster[] = [];

  for (const spec of CLUSTER_SPECS) {
    const candidates = matches
      .filter((rule) => (spec.key === "current" ? rule.pattern.kind === "fate" : spec.scopes.includes(rule.scope as never)) && !used.has(rule.key))
      .sort((left, right) => clusterScore(right, spec) - clusterScore(left, spec) || left.key.localeCompare(right.key, "vi"));

    const primary = candidates[0];
    if (!primary) throw new Error(`Không tìm thấy seed rule phù hợp cho cụm ${spec.key}`);
    used.add(primary.key);

    const support = candidates.find((rule) => !used.has(rule.key) && rule.evidence !== primary.evidence);
    if (support) used.add(support.key);
    clusters.push({ key: spec.key, title: spec.title, primary, support });
  }

  return clusters;
}

export function buildFreeOverviewNarrativePlan(chart: TuViChart): FreeOverviewNarrativePlan {
  const facts = extractFreeOverviewFacts(chart);
  const allMatches = loadInterpretationRules()
    .map((rule) => matchRule(rule, facts))
    .filter((rule): rule is ScoredInterpretationRule => Boolean(rule));
  const clusters = selectClusters(allMatches);

  return {
    facts,
    clusters,
    selectedRules: clusters.flatMap((cluster) => [cluster.primary, ...(cluster.support ? [cluster.support] : [])]),
    allMatches,
  };
}

function clean(value: string) {
  return value.replace(/^Căn cứ:\s*/iu, "").replace(/\s+/gu, " ").trim();
}

function evidence(rule: ScoredInterpretationRule) {
  return clean(rule.evidence);
}

type SupportDetail = "strength" | "caution" | "advice";

function renderRule(rule: ScoredInterpretationRule, primary: boolean, supportDetails: Set<string>) {
  const lines = [
    `### ${rule.title}`,
    clean(rule.summary),
    `**Dữ kiện lá số:** ${evidence(rule)}`,
    clean(rule.strengthText),
  ];
  if (primary || supportDetails.has(`${rule.key}:caution`)) lines.push(clean(rule.cautionText));
  if (primary || supportDetails.has(`${rule.key}:advice`)) lines.push(clean(rule.lifeAdviceText));
  return lines.join("\n\n");
}

function overviewCopy(
  plan: FreeOverviewNarrativePlan,
  chart: TuViChart,
  supportStrengths: Set<string>,
  supportDetails: Set<string>,
) {
  const intro = `# Bản tổng quan lá số của bạn

${chart.input.fullName}, bản đọc này được ghép trực tiếp từ những cung, sao và vận đang hiện diện trong lá số của bạn. Tám dấu hiệu phù hợp nhất được chia thành bốn cụm để bạn dễ đối chiếu với công việc, tiền bạc, quan hệ, trách nhiệm và nhịp nghỉ hiện tại. Mỗi nhận định bên dưới đều đi kèm dữ kiện tử vi cụ thể; đây là góc nhìn để bạn quan sát lựa chọn của bạn rõ hơn, không phải lời phán về kết quả chắc chắn.

Bạn đang ở tuổi ${plan.facts.age}, trong đại vận ${plan.facts.currentDecade.range} tại cung ${plan.facts.currentDecade.palace}. ${plan.facts.lifeContext} Vì vậy, hãy đọc chậm ở những đoạn gợi đúng một hành vi đang lặp lại, một áp lực bạn thường nhận thêm, hoặc một nhu cầu bạn vẫn khó nói thành lời.`;

  const sections = plan.clusters.map((cluster, index) => {
    const support = cluster.support
      ? `\n\n### Dấu hiệu bổ sung: ${cluster.support.title}\n\n${clean(cluster.support.summary)}\n\n**Dữ kiện lá số:** ${evidence(cluster.support)}${supportStrengths.has(cluster.support.key) ? `\n\n${clean(cluster.support.strengthText)}` : ""}${supportDetails.has(`${cluster.support.key}:caution`) ? `\n\n${clean(cluster.support.cautionText)}` : ""}${supportDetails.has(`${cluster.support.key}:advice`) ? `\n\n${clean(cluster.support.lifeAdviceText)}` : ""}`
      : "";
    return `## ${index + 1}. ${cluster.title}

${renderRule(cluster.primary, true, supportDetails)}${support}`;
  });

  const questions = [...plan.selectedRules]
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key, "vi"))
    .map((rule) => clean(rule.teaserQuestion))
    .filter((question, index, all) => all.indexOf(question) === index)
    .slice(0, 2);

  return `${intro}

${sections.join("\n\n")}

## Hai câu hỏi để bạn tự đối chiếu

- ${questions[0]}
- ${questions[1]}

Nếu bạn muốn nối bốn cụm này thành một lộ trình rõ hơn cho công việc, tài chính, quan hệ và vận năm ${chart.input.viewYear}, **Bản FULL 9 chương cá nhân hóa** sẽ đi sâu từ chính các dấu hiệu trên. Bạn có thể đọc tiếp khi thấy phù hợp, không cần quyết định vội.`.trim();
}

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const plan = buildFreeOverviewNarrativePlan(chart);
  const supports = plan.clusters.flatMap((cluster) => (cluster.support ? [cluster.support] : []));
  const supportStrengths = new Set(supports.map((rule) => rule.key));
  const supportDetails = new Set<string>();
  let output = overviewCopy(plan, chart, supportStrengths, supportDetails);

  for (const detail of ["caution", "advice"] as SupportDetail[]) {
    for (const rule of supports) {
      if (countWords(output) >= 1400) break;
      supportDetails.add(`${rule.key}:${detail}`);
      const candidate = overviewCopy(plan, chart, supportStrengths, supportDetails);
      if (countWords(candidate) <= 1650) output = candidate;
      else supportDetails.delete(`${rule.key}:${detail}`);
    }
  }

  for (const rule of [...supports].reverse()) {
    if (countWords(output) <= 1650) break;
    supportStrengths.delete(rule.key);
    output = overviewCopy(plan, chart, supportStrengths, supportDetails);
  }

  if (countWords(output) < 1400 || countWords(output) > 1650) {
    throw new Error(`Seed overview has ${countWords(output)} words; expected 1400-1650`);
  }
  return output;
}
