import { generateTuViChart, type Palace, type TuViChart } from "@/lib/chart";

export type WealthPillarKey = "cashflow" | "career" | "mobility" | "foundation";

export type WealthPillar = {
  key: WealthPillarKey;
  label: string;
  score: number;
  summary: string;
};

export type WealthYearPoint = {
  year: number;
  score: number;
  summary: string;
};

export type WealthPalaceEvidence = {
  palace: string;
  branch: string;
  mainStars: string[];
  supportStars: string[];
  cautionStars: string[];
};

export type WealthActionStep = {
  title: string;
  body: string;
};

export type WealthFortuneReport = {
  overallScore: number;
  postureLabel: string;
  pillars: WealthPillar[];
  fiveYearTrend: WealthYearPoint[];
  strongestYear: WealthYearPoint;
  cautionYear: WealthYearPoint;
  palaceEvidence: WealthPalaceEvidence[];
  postureSummary: string;
  actionPlan: WealthActionStep[];
  disclaimer: string;
};

const MIN_SCORE = 35;
const MAX_SCORE = 92;
const STATE_WEIGHT = { M: 8, V: 6, "Đ": 5, B: 1, H: -7 } as const;
const YEARLY_PALACE_NAMES = ["Tài Bạch", "Quan Lộc", "Thiên Di"];
const YEARLY_SUPPORT_WEIGHTS: Record<string, number> = {
  "L.Lộc Tồn": 8,
  "L.Thiên Mã": 5,
  "LN Văn tinh": 3,
};
const YEARLY_CAUTION_WEIGHTS: Record<string, number> = {
  "L.Kình Dương": -6,
  "L.Đà La": -6,
  "L.Thái Tuế": -4,
  "L.Tang Môn": -4,
  "L.Bạch Hổ": -4,
  "L.Thiên Hư": -3,
  "L.Thiên Khốc": -3,
};
const SUPPORT_STAR_PATTERN = /Lộc Tồn|Hóa Lộc|Hóa Quyền|Hóa Khoa|Tả Phù|Hữu Bật|Văn Xương|Văn Khúc|Thiên Khôi|Thiên Việt|Thiên Mã|Long Trì|Phượng Các|Ân Quang|Thiên Quý/;
const CAUTION_STAR_PATTERN = /Kình Dương|Đà La|Hỏa Tinh|Linh Tinh|Địa Không|Địa Kiếp|Hóa Kỵ|Tuần|Triệt|Thiên Hư|Thiên Khốc|Tang Môn|Bạch Hổ|Thái Tuế/;

const PILLAR_CONFIG: {
  key: WealthPillarKey;
  label: string;
  sources: { palace: string; weight: number }[];
  summary: string;
}[] = [
  {
    key: "cashflow",
    label: "Dòng tiền",
    sources: [
      { palace: "Tài Bạch", weight: 0.6 },
      { palace: "Phúc Đức", weight: 0.2 },
      { palace: "Điền Trạch", weight: 0.2 },
    ],
    summary: "Theo dõi nhịp thu chi và ưu tiên dữ kiện rõ ràng.",
  },
  {
    key: "career",
    label: "Năng lực tạo giá trị",
    sources: [
      { palace: "Quan Lộc", weight: 0.6 },
      { palace: "Mệnh", weight: 0.25 },
      { palace: "Thân", weight: 0.15 },
    ],
    summary: "Củng cố năng lực, vai trò và quy trình làm việc bền vững.",
  },
  {
    key: "mobility",
    label: "Mở rộng môi trường",
    sources: [
      { palace: "Thiên Di", weight: 0.6 },
      { palace: "Quan Lộc", weight: 0.25 },
      { palace: "Nô Bộc", weight: 0.15 },
    ],
    summary: "Chọn cơ hội hợp tác có thông tin và giới hạn rõ ràng.",
  },
  {
    key: "foundation",
    label: "Nền tích lũy",
    sources: [
      { palace: "Phúc Đức", weight: 0.4 },
      { palace: "Điền Trạch", weight: 0.35 },
      { palace: "Tài Bạch", weight: 0.25 },
    ],
    summary: "Giữ nhịp sức bền và thói quen trước các quyết định quan trọng.",
  },
];

function clampScore(value: number) {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
}

function findPalace(chart: TuViChart, name: string): Palace | undefined {
  return chart.palaces.find((item) => name === "Thân" ? item.isThan : item.name === name);
}

function scorePalace(palace: Palace | undefined) {
  if (!palace) {
    return 60;
  }

  const states = palace.mainStars
    .map((star) => palace.starStates[star])
    .filter((state): state is keyof typeof STATE_WEIGHT => Boolean(state) && state in STATE_WEIGHT);
  const stateScore = states.length === 0
    ? 0
    : states.reduce((total, state) => total + STATE_WEIGHT[state], 0) / states.length;
  const supportScore = palace.supportStars.filter((star) => SUPPORT_STAR_PATTERN.test(star)).length * 2;
  const cautionScore = palace.supportStars.filter((star) => CAUTION_STAR_PATTERN.test(star)).length * -2;

  return clampScore(60 + stateScore + supportScore + cautionScore);
}

function buildPillars(chart: TuViChart): WealthPillar[] {
  return PILLAR_CONFIG.map(({ key, label, sources, summary }) => ({
    key,
    label,
    score: clampScore(sources.reduce((total, source) => (
      total + scorePalace(findPalace(chart, source.palace)) * source.weight
    ), 0)),
    summary,
  }));
}

function weightedAverage(pillars: WealthPillar[], weights: Record<WealthPillarKey, number>) {
  return clampScore(pillars.reduce((total, pillar) => total + pillar.score * weights[pillar.key], 0));
}

function scoreYearlySignals(chart: TuViChart) {
  const yearlyStars = YEARLY_PALACE_NAMES.flatMap((name) => findPalace(chart, name)?.yearlyStars || []);
  const adjustment = yearlyStars.reduce((total, star) => (
    total + (YEARLY_SUPPORT_WEIGHTS[star] || 0) + (YEARLY_CAUTION_WEIGHTS[star] || 0)
  ), 0);
  return clampScore(60 + adjustment);
}

function scoreYear(chart: TuViChart): WealthYearPoint {
  const pillars = buildPillars(chart);
  const structuralScore = weightedAverage(pillars, {
    cashflow: 0.35,
    career: 0.30,
    mobility: 0.20,
    foundation: 0.15,
  });
  const score = clampScore(structuralScore * 0.65 + scoreYearlySignals(chart) * 0.35);

  return {
    year: chart.input.viewYear,
    score,
    summary: "Chỉ số định hướng kết hợp cấu trúc lá số và lưu tinh Tài - Quan - Di.",
  };
}

function buildFiveYearTrend(chart: TuViChart) {
  return Array.from({ length: 5 }, (_, offset) => {
    const year = chart.input.viewYear + offset;
    const yearlyChart = generateTuViChart({ ...chart.input, viewYear: year });
    return scoreYear(yearlyChart);
  });
}

function buildPalaceEvidence(chart: TuViChart): WealthPalaceEvidence[] {
  return YEARLY_PALACE_NAMES.map((name) => {
    const palace = findPalace(chart, name);
    if (!palace) {
      return {
        palace: name,
        branch: "Chưa có dữ liệu",
        mainStars: ["Chưa có dữ liệu"],
        supportStars: [],
        cautionStars: [],
      };
    }
    const accompanyingStars = [...palace.supportStars, ...palace.yearlyStars];
    return {
      palace: palace.name,
      branch: palace.branch,
      mainStars: palace.mainStars.map((star) => `${star} (${palace.starStates[star] || "B"})`),
      supportStars: accompanyingStars.filter((star) => SUPPORT_STAR_PATTERN.test(star)),
      cautionStars: accompanyingStars.filter((star) => CAUTION_STAR_PATTERN.test(star)),
    };
  });
}

function buildActionPlan(pillars: WealthPillar[]): WealthActionStep[] {
  const weakest = pillars.reduce((selected, pillar) => pillar.score < selected.score ? pillar : selected);
  const strongest = pillars.reduce((selected, pillar) => pillar.score > selected.score ? pillar : selected);

  return [
    {
      title: "Sửa trụ yếu",
      body: `Rà soát ${weakest.label.toLowerCase()} bằng một việc cụ thể có thể kiểm tra trong tuần, thay vì mở rộng ràng buộc khi nền chưa rõ.`,
    },
    {
      title: "Dùng trụ mạnh",
      body: `Dựa vào ${strongest.label.toLowerCase()} để chọn việc phù hợp với năng lực và thông tin đã xác thực.`,
    },
    {
      title: "Đặt cổng kiểm chứng",
      body: "Trước quyết định tài chính, ghi rõ dữ kiện, giới hạn chịu đựng rủi ro và người cần tham vấn độc lập.",
    },
  ];
}

function buildPostureSummary(pillars: WealthPillar[]) {
  const weakest = pillars.reduce((selected, pillar) => pillar.score < selected.score ? pillar : selected);
  const strongest = pillars.reduce((selected, pillar) => pillar.score > selected.score ? pillar : selected);
  return `Chỉ số định hướng cho thấy nên củng cố ${weakest.label.toLowerCase()} và phát huy ${strongest.label.toLowerCase()} theo từng bước có kiểm chứng.`;
}

function buildPostureLabel(pillars: WealthPillar[], overallScore: number) {
  if (overallScore < 55) {
    return "Phòng thủ và sửa nền";
  }

  const strongest = pillars.reduce((selected, pillar) => pillar.score > selected.score ? pillar : selected);
  return {
    cashflow: "Quản trị dòng tiền",
    career: "Tăng trưởng từ nghề",
    mobility: "Mở rộng có kiểm chứng",
    foundation: "Tích lũy bền",
  }[strongest.key];
}

export function buildWealthFortuneReport(chart: TuViChart): WealthFortuneReport {
  const pillars = buildPillars(chart);
  const overallScore = weightedAverage(pillars, {
    cashflow: 0.35,
    career: 0.30,
    mobility: 0.20,
    foundation: 0.15,
  });
  const fiveYearTrend = buildFiveYearTrend(chart);
  const strongestYear = fiveYearTrend.reduce((strongest, point) => point.score > strongest.score ? point : strongest);
  const cautionYear = fiveYearTrend.reduce((caution, point) => point.score < caution.score ? point : caution);

  return {
    overallScore,
    postureLabel: buildPostureLabel(pillars, overallScore),
    pillars,
    fiveYearTrend,
    strongestYear,
    cautionYear,
    palaceEvidence: buildPalaceEvidence(chart),
    postureSummary: buildPostureSummary(pillars),
    actionPlan: buildActionPlan(pillars),
    disclaimer: "Nội dung chỉ mang tính tham khảo, không thay thế tư vấn tài chính.",
  };
}
