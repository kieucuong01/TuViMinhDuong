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
  available: boolean;
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

export type WealthReaderExplanation = {
  heading: string;
  lead: string;
  strength: string;
  caution: string;
  nextStep: string;
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
  readerExplanation: WealthReaderExplanation;
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
        available: false,
        palace: name,
        branch: "Chưa có dữ liệu",
        mainStars: ["Chưa có dữ liệu"],
        supportStars: [],
        cautionStars: [],
      };
    }
    const accompanyingStars = [...palace.supportStars, ...palace.yearlyStars];
    return {
      available: true,
      palace: palace.name,
      branch: palace.branch,
      mainStars: palace.mainStars.map((star) => {
        const state = palace.starStates[star];
        return state ? `${star} (${state})` : star;
      }),
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
      title: "30 ngày — Sửa trụ yếu",
      body: `Trong 30 ngày đầu, ghi lại một dấu hiệu cụ thể của ${weakest.label.toLowerCase()} và xem lại mỗi tuần để hiểu nền hiện tại trước khi mở rộng ràng buộc.`,
    },
    {
      title: "60 ngày — Dùng trụ mạnh",
      body: `Từ ngày 31 đến 60, dùng ${strongest.label.toLowerCase()} cho một thử nghiệm nhỏ, có thể điều chỉnh; đối chiếu kết quả ở giữa và cuối giai đoạn bằng thông tin đã xác thực.`,
    },
    {
      title: "90 ngày — Đặt cổng kiểm chứng",
      body: "Đến ngày 90, tổng hợp dữ kiện để chọn tiếp tục, điều chỉnh hoặc dừng; với quyết định tài chính, ghi rõ giới hạn rủi ro và người cần tham vấn độc lập.",
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

function buildReaderExplanation(pillars: WealthPillar[], postureLabel: string): WealthReaderExplanation {
  const weakest = pillars.reduce((selected, pillar) => pillar.score < selected.score ? pillar : selected);
  const strongest = pillars.reduce((selected, pillar) => pillar.score > selected.score ? pillar : selected);

  return {
    heading: "Luận giải dễ hiểu",
    lead: `Thế tài lộc hiện nghiêng về "${postureLabel}". Hiểu đơn giản: lá số không nói bạn sẽ giàu nghèo ra sao, mà gợi ý cách nên quản trị tiền, nghề và môi trường để quyết định chậm, rõ và có số liệu hơn.`,
    strength: `Điểm sáng là ${strongest.label.toLowerCase()} (${strongest.score}/100): đây là trụ mạnh nên dùng cho một cơ hội nhỏ, đo được, có thời hạn xem lại, thay vì dàn trải nhiều hướng cùng lúc.`,
    caution: `Điểm cần canh chừng là ${weakest.label.toLowerCase()} (${weakest.score}/100): không nên tăng ràng buộc khi phần này chưa có dữ kiện, giới hạn rủi ro và phương án dừng rõ ràng.`,
    nextStep: `Trong 30 ngày tới, hãy chọn một việc thật liên quan đến ${weakest.label.toLowerCase()} để ghi chép mỗi tuần; khi phần yếu ổn hơn, mới dùng ${strongest.label.toLowerCase()} để thử bước tiếp theo.`,
  };
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
  const postureLabel = buildPostureLabel(pillars, overallScore);

  return {
    overallScore,
    postureLabel,
    pillars,
    fiveYearTrend,
    strongestYear,
    cautionYear,
    palaceEvidence: buildPalaceEvidence(chart),
    postureSummary: buildPostureSummary(pillars),
    readerExplanation: buildReaderExplanation(pillars, postureLabel),
    actionPlan: buildActionPlan(pillars),
    disclaimer: "Nội dung chỉ mang tính tham khảo, không thay thế tư vấn tài chính.",
  };
}
