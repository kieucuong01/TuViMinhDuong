import type { TuViChart } from "@/lib/chart";
import {
  IMPORTANT_INTERPRETATION_PALACES,
  type InterpretationRule,
  loadInterpretationRules,
} from "@/lib/interpretation-rules";
import { buildFreeOverviewTeaser, countVisibleMarkdownWords } from "@/lib/free-overview-presentation";

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

function rulesSharePalace(left: ScoredInterpretationRule, right: ScoredInterpretationRule) {
  const rightPalaces = new Set(rulePalaces(right));
  return rulePalaces(left).some((palace) => rightPalaces.has(palace));
}

function summarySentences(rule: ScoredInterpretationRule) {
  return clean(rule.summary)
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function normalizedWords(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi")
    .replace(/đ/gu, "d")
    .replace(/[^a-z0-9\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function hasRepeatedWordWindow(value: string, size: number) {
  const words = normalizedWords(value);
  const seen = new Set<string>();
  for (let index = 0; index <= words.length - size; index += 1) {
    const window = words.slice(index, index + size).join(" ");
    if (seen.has(window)) return true;
    seen.add(window);
  }
  return false;
}

function buildQuickReadCopy(primary: ScoredInterpretationRule, support: ScoredInterpretationRule) {
  const primarySentences = summarySentences(primary).map((sentence) => ({ sentence, source: "primary" }));
  const supportSentences = summarySentences(support).map((sentence) => ({ sentence, source: "support" }));
  const sentences = [...primarySentences, ...supportSentences];
  let best: { copy: string; words: number } | null = null;

  for (let mask = 1; mask < 2 ** sentences.length; mask += 1) {
    const selected = sentences.filter((_, index) => (mask & (1 << index)) !== 0);
    if (!selected.some((item) => item.source === "primary") || !selected.some((item) => item.source === "support")) {
      continue;
    }
    const copy = selected.map((item) => item.sentence).join(" ");
    const words = countVisibleMarkdownWords(copy);
    if (words < 80 || words > 120) continue;
    if (hasRepeatedWordWindow(copy, 8)) continue;
    if (!best || words > best.words) best = { copy, words };
  }

  return best?.copy ?? null;
}

function findRelatedSupport(
  candidates: ScoredInterpretationRule[],
  primary: ScoredInterpretationRule,
  used: Set<string>,
  requireQuickReadRange: boolean,
) {
  return candidates.find((rule) => {
    if (rule.key === primary.key || used.has(rule.key) || rule.evidence === primary.evidence) return false;
    if (!rulesSharePalace(primary, rule)) return false;
    if (!requireQuickReadRange) return true;
    return Boolean(buildQuickReadCopy(primary, rule));
  });
}

function selectClusters(matches: ScoredInterpretationRule[]) {
  const used = new Set<string>();
  const clusters: FreeOverviewCluster[] = [];

  for (const spec of CLUSTER_SPECS) {
    const candidates = matches
      .filter((rule) => (spec.key === "current" ? rule.pattern.kind === "fate" : spec.scopes.includes(rule.scope as never)) && !used.has(rule.key))
      .sort((left, right) => clusterScore(right, spec) - clusterScore(left, spec) || left.key.localeCompare(right.key, "vi"));
    const fallbackCandidates = spec.key === "current" && candidates.length === 0
      ? matches
          .filter((rule) => !used.has(rule.key))
          .sort((left, right) => clusterScore(right, spec) - clusterScore(left, spec) || left.key.localeCompare(right.key, "vi"))
      : candidates;

    const primary =
      spec.key === "identity"
        ? fallbackCandidates.find((candidate) => Boolean(findRelatedSupport(fallbackCandidates, candidate, used, true)))
        : fallbackCandidates[0];
    if (!primary) throw new Error(`Không tìm thấy seed rule phù hợp cho cụm ${spec.key}`);
    used.add(primary.key);

    const support = findRelatedSupport(fallbackCandidates, primary, used, spec.key === "identity");
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

function supportDetailKey(rule: ScoredInterpretationRule, detail: SupportDetail) {
  return `${rule.key}:${detail}`;
}

function joinParagraph(...values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value)).join(" ");
}

function youthCopy(value: string) {
  return value
    .replace(/Công việc và nguồn lực/gu, "Học tập và nguồn lực")
    .replace(/công việc và trách nhiệm nghề nghiệp/giu, "học tập, trách nhiệm ở lớp và định hướng tương lai")
    .replace(/trách nhiệm công việc/giu, "trách nhiệm học tập")
    .replace(/vị trí nghề nghiệp/giu, "vị trí trong môi trường học tập")
    .replace(/tiêu chuẩn giao hàng/giu, "tiêu chuẩn hoàn thành")
    .replace(/nghề nghiệp/giu, "định hướng tương lai")
    .replace(/công việc/giu, "việc học")
    .replace(/kiếm tiền/giu, "tạo kết quả")
    .replace(/làm việc/giu, "học và làm việc")
    .replace(/part-time/giu, "việc làm thêm phù hợp")
    .replace(/thương lượng lại quyền hạn/giu, "trao đổi lại phạm vi")
    .replace(/quyền hạn/giu, "phạm vi được tự chọn")
    .replace(/tiền nên giữ hay xoay/giu, "nguồn lực nên giữ hay dùng")
    .replace(/quan hệ thân mật/giu, "quan hệ gần gũi")
    .replace(/tình yêu/giu, "tình cảm")
    .replace(/hôn nhân/giu, "quan hệ lâu dài")
    .replace(/bạn đời/giu, "người đồng hành")
    .replace(/thành tiền/giu, "thành kết quả")
    .replace(/lương/giu, "phần thưởng")
    .replace(/chi phí/giu, "phần đóng góp")
    .replace(/quyền quyết định/giu, "quyền tự chọn trong phạm vi của bạn")
    .replace(/quyền quyết/giu, "quyền tự chọn");
}

function audienceCopy(value: string, facts: FreeOverviewFacts) {
  return facts.age < 18 ? youthCopy(value) : value;
}

function renderCluster(cluster: FreeOverviewCluster, index: number, supportDetails: Set<string>, facts: FreeOverviewFacts) {
  const { primary, support } = cluster;
  const firstCluster = index === 0;
  const highlight =
    firstCluster && support
      ? clean(support.strengthText)
      : joinParagraph(clean(primary.summary), support ? clean(support.summary) : undefined);
  const strength = joinParagraph(
    clean(primary.strengthText),
    !firstCluster && support && supportDetails.has(supportDetailKey(support, "strength"))
      ? clean(support.strengthText)
      : undefined,
  );
  const caution = joinParagraph(
    clean(primary.cautionText),
    support && supportDetails.has(supportDetailKey(support, "caution")) ? clean(support.cautionText) : undefined,
  );
  const advice = joinParagraph(
    clean(primary.lifeAdviceText),
    support && supportDetails.has(supportDetailKey(support, "advice")) ? clean(support.lifeAdviceText) : undefined,
  );
  const evidenceText = joinParagraph(
    `**Dữ kiện lá số:** ${evidence(primary)}`,
    support ? `**Dấu hiệu liên quan:** ${evidence(support)}` : undefined,
  );

  return audienceCopy(`## ${index + 1}. ${cluster.title}

### Điểm nổi bật

${highlight}

### Lợi thế

${strength}

### Điểm cần lưu ý

${caution}

### Gợi ý thực tế

${advice}

### Vì sao có nhận định này

${evidenceText}`, facts);
}

function overviewCopy(
  plan: FreeOverviewNarrativePlan,
  chart: TuViChart,
  supportDetails: Set<string>,
) {
  const intro = `# Bản tổng quan lá số của bạn

${chart.input.fullName}, bản đọc này được ghép trực tiếp từ những cung, sao và vận đang hiện diện trong lá số của bạn. Tám dấu hiệu phù hợp nhất được chia thành bốn cụm để bạn dễ đối chiếu với công việc, tiền bạc, quan hệ, trách nhiệm và nhịp nghỉ hiện tại. Mỗi nhận định bên dưới đều đi kèm dữ kiện tử vi cụ thể; đây là góc nhìn để bạn quan sát lựa chọn của bạn rõ hơn, không phải lời phán về kết quả chắc chắn.

Bạn đang ở tuổi ${plan.facts.age}, trong đại vận ${plan.facts.currentDecade.range} tại cung ${plan.facts.currentDecade.palace}. ${plan.facts.lifeContext} Vì vậy, hãy đọc chậm ở những đoạn gợi đúng một hành vi đang lặp lại, một áp lực bạn thường nhận thêm, hoặc một nhu cầu bạn vẫn khó nói thành lời.`;

  const firstCluster = plan.clusters[0];
  if (!firstCluster.support) throw new Error("Cụm đầu tiên cần một dấu hiệu liên quan cho phần đọc nhanh");
  const quickReadCopy = buildQuickReadCopy(firstCluster.primary, firstCluster.support);
  if (!quickReadCopy) throw new Error("Không thể tạo phần đọc nhanh 80-120 từ từ các câu seed nguyên vẹn");
  const quickRead = `### Đọc nhanh

${quickReadCopy}`;
  const sections = plan.clusters.map((cluster, index) => renderCluster(cluster, index, supportDetails, plan.facts));
  const reflection = `**Câu hỏi tự đối chiếu:** ${clean(firstCluster.primary.teaserQuestion)}`;
  const fullBridge = audienceCopy(
    `Bản miễn phí mới cho bạn thấy 2 lớp đầu: khí chất và nguồn lực. **Bản FULL 9 chương cá nhân hóa** đi tiếp vào 4 câu hỏi thực tế: quan hệ nên mở hay giữ ranh giới, tiền nên giữ hay xoay, vận năm ${chart.input.viewYear} cần chậm ở đâu, và 90 ngày tới nên làm việc gì trước.`,
    plan.facts,
  );

  return [
    audienceCopy(intro, plan.facts),
    audienceCopy(quickRead, plan.facts),
    sections[0],
    sections[1],
    audienceCopy(reflection, plan.facts),
    fullBridge,
    sections[2],
    sections[3],
  ].join("\n\n");
}

function optionalSupportDetails(plan: FreeOverviewNarrativePlan) {
  return plan.clusters.flatMap((cluster, index) => {
    if (!cluster.support) return [];
    return [
      ...(index === 0 ? [] : [supportDetailKey(cluster.support, "strength")]),
      supportDetailKey(cluster.support, "caution"),
      supportDetailKey(cluster.support, "advice"),
    ];
  });
}

function overviewWordBudgets(content: string) {
  return {
    guest: countVisibleMarkdownWords(buildFreeOverviewTeaser(content)),
    full: countVisibleMarkdownWords(content),
  };
}

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const plan = buildFreeOverviewNarrativePlan(chart);
  const options = optionalSupportDetails(plan);
  const baseOutput = overviewCopy(plan, chart, new Set());
  const baseWords = overviewWordBudgets(baseOutput);
  const optionDeltas = options.map((option) => {
    const words = overviewWordBudgets(overviewCopy(plan, chart, new Set([option])));
    return { guest: words.guest - baseWords.guest, full: words.full - baseWords.full };
  });
  let best: { mask: number; guest: number; full: number } | null = null;

  for (let mask = 0; mask < 2 ** options.length; mask += 1) {
    const words = optionDeltas.reduce(
      (total, delta, index) => {
        if ((mask & (1 << index)) !== 0) {
          total.guest += delta.guest;
          total.full += delta.full;
        }
        return total;
      },
      { ...baseWords },
    );
    if (words.guest < 800 || words.guest > 950 || words.full < 1400 || words.full > 1650) continue;
    if (!best || words.guest + words.full > best.guest + best.full) {
      best = { mask, ...words };
    }
  }

  if (!best) {
    const minimum = overviewWordBudgets(overviewCopy(plan, chart, new Set()));
    const maximum = overviewWordBudgets(overviewCopy(plan, chart, new Set(options)));
    throw new Error(
      `Seed overview cannot satisfy visible-word budgets; guest ${minimum.guest}-${maximum.guest}, full ${minimum.full}-${maximum.full}`,
    );
  }

  const enabled = new Set(options.filter((_, index) => (best.mask & (1 << index)) !== 0));
  return overviewCopy(plan, chart, enabled);
}
