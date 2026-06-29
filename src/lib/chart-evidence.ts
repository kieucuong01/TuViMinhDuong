import type { Palace, TuViChart } from "@/lib/chart";

const IMPORTANT_PALACES = ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"] as const;
const CAUTION_STAR_HINTS = ["Kình", "Đà", "Không", "Kiếp", "Hỏa", "Linh", "Kỵ", "Tuần", "Triệt"];

export type ChartEvidenceSignal = {
  kind: "strength" | "opportunity" | "caution";
  area: "identity" | "career" | "money" | "relationship" | "health" | "year";
  summary: string;
  evidence: string[];
};

export type ChartEvidencePalace = {
  name: string;
  branch: string;
  stars: string[];
  hasTuan: boolean;
  hasTriet: boolean;
};

export type ChartEvidenceProfile = {
  fullName: string;
  viewYear: number;
  menh: string;
  than: string;
  cuc: string;
  palaces: ChartEvidencePalace[];
  signals: ChartEvidenceSignal[];
};

export type ReportOutlineItem = {
  key: string;
  title: string;
  description: string;
};

function palaceStars(palace: Palace, limit = 10) {
  return [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars]
    .filter((star, index, values) => values.indexOf(star) === index)
    .slice(0, limit)
    .map((star) => {
      const state = palace.starStates[star];
      return state ? `${star} (${state})` : star;
    });
}

function palaceEvidenceLine(palace: Palace, limit = 4) {
  const stars = palaceStars(palace, limit);
  return `Cung ${palace.name} tại ${palace.branch}: ${stars.join(", ") || "không có sao nổi bật"}`;
}

function palaceEvidence(chart: TuViChart, name: string, limit = 4) {
  const palace = chart.palaces.find((item) => item.name === name);
  if (!palace) return [`Cung ${name}: chưa có dữ liệu`];
  return [palaceEvidenceLine(palace, limit)];
}

function cautionEvidence(chart: TuViChart) {
  for (const name of IMPORTANT_PALACES) {
    const palace = chart.palaces.find((item) => item.name === name);
    if (!palace) continue;
    const cautionStars = [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars].filter((star) =>
      CAUTION_STAR_HINTS.some((hint) => star.includes(hint)),
    );
    if (cautionStars.length) return [`Cung ${name}: ${cautionStars.slice(0, 4).join(", ")}`];
  }
  return palaceEvidence(chart, "Tật Ách");
}

export function buildChartEvidenceProfile(chart: TuViChart): ChartEvidenceProfile {
  const thanPalace = chart.palaces.find((palace) => palace.isThan);
  const palaces = chart.palaces.map((palace) => ({
    name: palace.name,
    branch: palace.branch,
    stars: palaceStars(palace),
    hasTuan: palace.supportStars.includes("Tuần"),
    hasTriet: palace.supportStars.includes("Triệt"),
  }));

  return {
    fullName: chart.input.fullName,
    viewYear: chart.input.viewYear,
    menh: chart.menh,
    than: chart.than,
    cuc: chart.cuc,
    palaces,
    signals: [
      {
        kind: "strength",
        area: "identity",
        summary: "Năng lực cốt lõi cần đối chiếu từ Mệnh và Thân",
        evidence: [
          ...palaceEvidence(chart, "Mệnh"),
          thanPalace ? palaceEvidenceLine(thanPalace) : `Thân tại ${chart.than}: chưa có dữ liệu cung`,
        ],
      },
      {
        kind: "opportunity",
        area: "money",
        summary: "Cơ hội công việc và tài chính cần đọc cùng nhau",
        evidence: [...palaceEvidence(chart, "Quan Lộc"), ...palaceEvidence(chart, "Tài Bạch")],
      },
      {
        kind: "caution",
        area: "year",
        summary: `Vùng cần kiểm chứng và quản trị rủi ro trong năm ${chart.input.viewYear}`,
        evidence: cautionEvidence(chart),
      },
    ],
  };
}

function firstStar(profile: ChartEvidenceProfile, palaceName: string) {
  return profile.palaces.find((palace) => palace.name === palaceName)?.stars[0]?.replace(/\s+\([MVĐBH]\)$/, "");
}

export function buildPersonalizedReportOutline(chart: TuViChart): ReportOutlineItem[] {
  const profile = buildChartEvidenceProfile(chart);
  const moneyPalace = profile.palaces.find((palace) => palace.name === "Tài Bạch");
  const moneyBlocker = moneyPalace?.hasTuan ? "Tuần" : moneyPalace?.hasTriet ? "Triệt" : null;
  const careerStar = firstStar(profile, "Quan Lộc");
  const moneyStar = firstStar(profile, "Tài Bạch");
  const relationshipStar = firstStar(profile, "Phu Thê");
  const healthStar = firstStar(profile, "Tật Ách");

  return [
    {
      key: "overview",
      title: `Bản đồ định hướng của ${profile.fullName}`,
      description: `Ghép Mệnh ${profile.menh}, ${profile.than} và ${profile.cuc} thành một bức tranh nhất quán.`,
    },
    {
      key: "menh-than",
      title: "Điểm mạnh, điểm yếu từ Mệnh và Thân",
      description: "Cách ra quyết định, phản ứng khi chịu áp lực và vùng năng lực nên đầu tư dài hạn.",
    },
    {
      key: "twelve-palaces",
      title: "12 cung và những mắt xích ảnh hưởng lẫn nhau",
      description: "Không đọc từng cung tách rời; đối chiếu các lĩnh vực quan trọng trong cùng lá số.",
    },
    {
      key: "career",
      title: careerStar ? `${careerStar} tại Quan Lộc nói gì về đường nghề nghiệp?` : "Đường nghề nghiệp phù hợp với lá số này",
      description: "Môi trường làm việc, cách phát huy năng lực và điểm nghẽn cần quản trị.",
    },
    {
      key: "money",
      title: moneyBlocker
        ? `Vì sao cung Tài Bạch của bạn gặp ${moneyBlocker}?`
        : moneyStar
          ? `${moneyStar} tại Tài Bạch ảnh hưởng cách tạo và giữ tiền ra sao?`
          : "Cách tạo, giữ và phân bổ nguồn lực tài chính",
      description: "Cơ hội dòng tiền, thói quen tích lũy và rủi ro cần kiểm tra trước quyết định lớn.",
    },
    {
      key: "relationship",
      title: relationshipStar ? `${relationshipStar} tại Phu Thê và cách xây quan hệ bền vững` : "Tình cảm, hôn nhân và cách giao tiếp phù hợp",
      description: "Nhu cầu cảm xúc, kiểu xung đột dễ gặp và cách giữ ranh giới lành mạnh.",
    },
    {
      key: "health",
      title: healthStar ? `${healthStar} tại Tật Ách: nhịp sống nào cần điều chỉnh?` : "Sức khỏe, tinh thần và nhịp nghỉ ngơi",
      description: "Tín hiệu quá tải để chủ động theo dõi; không thay thế tư vấn y khoa.",
    },
    {
      key: "yearly-months",
      title: `Thời điểm cơ hội và rủi ro trong năm ${profile.viewYear}`,
      description: "Các mốc nên chủ động, nên kiểm chứng và gợi ý hành động theo từng tháng.",
    },
  ];
}

export function formatChartEvidence(profile: ChartEvidenceProfile) {
  const palaceLines = profile.palaces.map(
    (palace) =>
      `- ${palace.name} (${palace.branch}): ${palace.stars.join(", ") || "không có sao nổi bật"}${
        palace.hasTuan || palace.hasTriet
          ? `; án ngữ: ${[palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""].filter(Boolean).join(", ")}`
          : ""
      }`,
  );
  const signalLines = profile.signals.map(
    (signal) => `- ${signal.kind}/${signal.area}: ${signal.summary}. Dẫn chứng: ${signal.evidence.join(" | ")}`,
  );

  return [
    `Họ tên: ${profile.fullName}`,
    `Năm xem: ${profile.viewYear}`,
    `Mệnh: ${profile.menh}`,
    `Thân: ${profile.than}`,
    `Cục: ${profile.cuc}`,
    "Dữ liệu cung:",
    ...palaceLines,
    "Tín hiệu ưu tiên:",
    ...signalLines,
  ].join("\n");
}
