import { type TuViChart } from "@/lib/chart";
import { generateWithLlmRouter, hasExternalLlmProvider } from "@/lib/llm-router";
import { FEATURE_PRICES, type ReadingKey } from "@/lib/pricing";

export const FREE_OVERVIEW_MIN_WORDS = 1200;
export const FREE_OVERVIEW_MAX_WORDS = 2000;
export const FREE_OVERVIEW_MAX_TOKENS = 7000;
export const PAID_READING_CHAPTER_MAX_TOKENS = 7000;
export const FREE_OVERVIEW_VERSION = "free-overview-llm-v3";
export const PAID_READING_VERSION = "paid-reading-chapters-v2";
export const PAID_FULL_WORD_TARGET = "8.000-12.000 từ";

const IMPORTANT_PALACES = ["Mệnh", "Thân", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"];
const GOOD_STAR_HINTS = ["Lộc", "Khoa", "Quyền", "Tả", "Hữu", "Xương", "Khúc", "Khôi", "Việt", "Thiên Mã", "Long Trì", "Phượng"];
const RISK_STAR_HINTS = ["Kình", "Đà", "Không", "Kiếp", "Hỏa", "Linh", "Tang", "Hổ", "Khốc", "Hư", "Riêu", "Kỵ", "Thiên La", "Địa Võng"];

type DeepScoreKey = "career" | "money" | "love" | "health" | "year";

export type DeepReadingScore = {
  key: DeepScoreKey;
  label: string;
  value: number;
};

export type PaidReadingChapter = {
  key: string;
  title: string;
  requiredSections: string[];
  instruction: string;
  targetWords: string;
};

function isLlmDisabledForSmoke() {
  return process.env.PLAYWRIGHT_DISABLE_LLM === "1";
}

export function countWords(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function isCompleteFreeOverview(content: string) {
  const requiredHeadings = [
    "## Tổng quan miễn phí",
    "## Mệnh và Thân nói gì",
    "## Điểm mạnh dễ phát huy",
    "## Điều nên lưu ý",
    "## Gợi ý cho năm",
  ];

  return countWords(content) >= FREE_OVERVIEW_MIN_WORDS && requiredHeadings.every((heading) => content.includes(heading));
}

function clampScore(value: number) {
  return Math.max(35, Math.min(92, Math.round(value)));
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

function palaceByName(chart: TuViChart, name: string) {
  if (name === "Thân") {
    const thanName = chart.than?.replace("Thân cư ", "");
    return chart.palaces.find((item) => item.name === thanName);
  }
  return chart.palaces.find((item) => item.name === name);
}

function starsWithStates(chart: TuViChart, stars: string[], palaceName: string, fallback: string) {
  const palace = chart.palaces.find((item) => item.name === palaceName);
  if (!stars.length) return fallback;
  return stars
    .map((star) => {
      const state = palace?.starStates?.[star];
      return state ? `${star} (${state})` : star;
    })
    .join(", ");
}

function starSignalScore(chart: TuViChart, palaceNames: string[]) {
  let score = 64;
  for (const name of palaceNames) {
    const palace = palaceByName(chart, name);
    if (!palace) continue;
    const stars = [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars];
    for (const star of stars) {
      const state = palace.starStates?.[star];
      if (state === "M") score += 7;
      if (state === "V") score += 6;
      if (state === "Đ") score += 5;
      if (state === "H") score -= 8;
      if (GOOD_STAR_HINTS.some((hint) => star.includes(hint))) score += 2;
      if (RISK_STAR_HINTS.some((hint) => star.includes(hint))) score -= 3;
      if (star.startsWith("L.") && RISK_STAR_HINTS.some((hint) => star.includes(hint))) score -= 2;
      if (star.startsWith("L.") && GOOD_STAR_HINTS.some((hint) => star.includes(hint))) score += 2;
    }
  }
  return clampScore(score);
}

export function getDeepReadingScores(chart: TuViChart): DeepReadingScore[] {
  return [
    { key: "career", label: "Công việc", value: starSignalScore(chart, ["Mệnh", "Thân", "Quan Lộc", "Thiên Di"]) },
    { key: "money", label: "Tài chính", value: starSignalScore(chart, ["Tài Bạch", "Quan Lộc", "Phúc Đức"]) },
    { key: "love", label: "Tình cảm", value: starSignalScore(chart, ["Phu Thê", "Phụ Mẫu", "Huynh Đệ", "Tử Tức"]) },
    { key: "health", label: "Sức khỏe", value: starSignalScore(chart, ["Tật Ách", "Mệnh", "Thân"]) },
    { key: "year", label: "Vận năm", value: starSignalScore(chart, IMPORTANT_PALACES) },
  ];
}

export function getDeepReadingSummary(chart: TuViChart) {
  return {
    version: PAID_READING_VERSION,
    wordTarget: PAID_FULL_WORD_TARGET,
    viewerAddress: viewerAddress(chart),
    age: chartAge(chart),
    viewYear: chart.input.viewYear,
    scores: getDeepReadingScores(chart),
  };
}

function compactStars(chart: TuViChart, palaceName: string, stars: string[], fallback: string, limit = 10) {
  if (!stars.length) return fallback;
  const palace = chart.palaces.find((item) => item.name === palaceName);
  const visible = stars.slice(0, limit).map((star) => {
    const state = palace?.starStates?.[star];
    return state ? `${star} (${state})` : star;
  });
  const remaining = stars.length - visible.length;
  return remaining > 0 ? `${visible.join(", ")} + ${remaining} sao khác` : visible.join(", ");
}

function compactPalaceContext(chart: TuViChart) {
  return chart.palaces
    .map((palace) => {
      const labels = [palace.isMenh ? "Mệnh" : "", palace.isThan ? "Thân" : ""].filter(Boolean).join(", ");
      return [
        `${palace.name}${labels ? ` [${labels}]` : ""} tại ${palace.branch}`,
        `đại vận ${palace.ageRange}`,
        `trường sinh ${palace.lifecycle}`,
        `chính tinh: ${compactStars(chart, palace.name, palace.mainStars, "vô chính diệu", 4)}`,
        `phụ tinh: ${compactStars(chart, palace.name, palace.supportStars, "không nổi bật", 9)}`,
        `sao lưu năm: ${compactStars(chart, palace.name, palace.yearlyStars, "không nổi bật", 7)}`,
      ].join("; ");
    })
    .join("\n");
}

function compactImportantPalaces(chart: TuViChart) {
  return IMPORTANT_PALACES.map((name) => {
    const palace = palaceByName(chart, name);
    if (!palace) return `${name}: chưa xác định`;
    return `${name}: cung ${palace.name} tại ${palace.branch}; chính tinh ${compactStars(chart, palace.name, palace.mainStars, "vô chính diệu", 5)}; phụ tinh ${compactStars(chart, palace.name, palace.supportStars, "không nổi bật", 8)}; sao lưu ${compactStars(chart, palace.name, palace.yearlyStars, "không nổi bật", 7)}; vòng ${palace.lifecycle}`;
  }).join("\n");
}

function compactDecadeContext(chart: TuViChart) {
  const currentAge = chartAge(chart);
  const current = chart.daiVan.find((period) => {
    const [start, end] = period.range.split("-").map(Number);
    return currentAge >= start && currentAge <= end;
  });
  const allPeriods = chart.daiVan.map((period) => `${period.range} tuổi: ${period.palace} (${period.branch})`).join("; ");
  return {
    currentAge,
    current: current ? `${current.range} tuổi tại cung ${current.palace} (${current.branch})` : "không xác định",
    allPeriods,
  };
}

function getFocusData(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const palace = chart.palaces.find((item) => item.name === scopeKey || item.branch === scopeKey);
  if (palace) {
    return {
      title: `${palace.name} tại ${palace.branch}`,
      evidence: [
        `Chính tinh: ${starsWithStates(chart, palace.mainStars, palace.name, "không có")}`,
        `Phụ tinh: ${starsWithStates(chart, palace.supportStars, palace.name, "bình hòa")}`,
        `Lưu niên: ${starsWithStates(chart, palace.yearlyStars, palace.name, "không nổi bật")}`,
        `Vòng trường sinh: ${palace.lifecycle}`,
      ],
    };
  }

  const decade = compactDecadeContext(chart);
  const majorPeriod = chart.daiVan.find((period) => period.range === scopeKey);
  if (majorPeriod) {
    const periodPalace = chart.palaces.find((item) => item.name === majorPeriod.palace);
    return {
      title: `Đại vận ${majorPeriod.range} tuổi tại cung ${majorPeriod.palace}`,
      evidence: [
        `Giai đoạn: ${majorPeriod.range} tuổi`,
        `Cung đại vận: ${majorPeriod.palace} tại ${majorPeriod.branch}`,
        `Chính tinh: ${periodPalace ? starsWithStates(chart, periodPalace.mainStars, periodPalace.name, "vô chính diệu") : "đang cập nhật"}`,
        `Phụ tinh: ${periodPalace ? starsWithStates(chart, periodPalace.supportStars, periodPalace.name, "không nổi bật") : "đang cập nhật"}`,
        `Sao lưu năm: ${periodPalace ? starsWithStates(chart, periodPalace.yearlyStars, periodPalace.name, "không nổi bật") : "không nổi bật"}`,
      ],
    };
  }

  const minorYear = scopeKey.match(/^tieu-(\d{4})$/)?.[1];
  if (minorYear) {
    const year = Number(minorYear);
    const age = year - chart.solar.year;
    const period = chart.daiVan.find((item) => {
      const [start, end] = item.range.split("-").map(Number);
      return age >= start && age <= end;
    });
    return {
      title: `Tiểu vận năm ${year}`,
      evidence: [
        `Năm tiểu vận: ${year}, tuổi ${age}`,
        period ? `Nền đại vận: ${period.range} tuổi tại cung ${period.palace}` : "Nền đại vận: chưa xác định",
        `Năm xem gốc: ${chart.input.viewYear}`,
        `Mệnh/Thân: ${chart.menh} / ${chart.than}`,
        `Sao lưu niên cần xét: L.Thái Tuế, L.Lộc Tồn, L.Kình Dương, L.Đà La, L.Tang Môn, L.Bạch Hổ nếu có trong JSON`,
      ],
    };
  }

  const monthlyScope = scopeKey.match(/^(\d{4})-(\d{2})$/);
  if (monthlyScope) {
    return {
      title: `Nguyệt vận tháng ${Number(monthlyScope[2])} năm ${monthlyScope[1]}`,
      evidence: [
        `Tháng cần luận: ${monthlyScope[2]}/${monthlyScope[1]}`,
        `Nền năm xem: ${chart.input.viewYear}`,
        `Mệnh/Thân/Cục: ${chart.menh} / ${chart.than} / ${chart.cuc}`,
        `Cung trọng yếu cần đối chiếu: Mệnh, Quan Lộc, Tài Bạch, Phu Thê, Tật Ách, Thiên Di`,
      ],
    };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(scopeKey) || scopeKey === "today") {
    return {
      title: `Nhật vận cá nhân hóa ${scopeKey}`,
      evidence: [
        `Ngày cần luận: ${scopeKey}`,
        `Năm xem của lá số: ${chart.input.viewYear}`,
        `Tuổi/năm sinh: ${chart.canChi.year}`,
        `Mệnh/Thân/Cục: ${chart.menh} / ${chart.than} / ${chart.cuc}`,
        `Khi luận ngày phải dùng dữ liệu xem ngày đã tính ở UI nếu có, và đối chiếu Mệnh/Thân/vận năm trong JSON`,
      ],
    };
  }

  return {
    title: `${FEATURE_PRICES[type].label} - ${scopeKey}`,
    evidence: [
      `Mệnh: ${chart.menh}`,
      `Thân: ${chart.than}`,
      `Cục: ${chart.cuc}`,
      `Cân lượng cốt: ${chart.boneWeight?.label || "đang cập nhật"}`,
      `Lai nhân: ${chart.laiNhan || "đang cập nhật"}`,
      `Âm dương: ${chart.amDuong}`,
      `Đại vận hiện tại: ${decade.current}`,
    ],
  };
}

function freeOverviewPrompt(chart: TuViChart) {
  const menhPalace = chart.palaces.find((item) => item.name === "Mệnh");
  const thanPalace = palaceByName(chart, "Thân");
  const decade = compactDecadeContext(chart);
  const mainEvidence = [
    `Họ tên: ${chart.input.fullName}`,
    `Giới tính: ${chart.input.gender === "male" ? "Nam" : "Nữ"}`,
    `Dương lịch: ${chart.solar.day}/${chart.solar.month}/${chart.solar.year}`,
    `Âm lịch: ${chart.lunar.day}/${chart.lunar.month}/${chart.lunar.year}`,
    `Can chi năm/tháng/ngày/giờ: ${chart.canChi.year} / ${chart.canChi.month} / ${chart.canChi.day} / ${chart.canChi.hour}`,
    `Năm xem: ${chart.input.viewYear}, tuổi xem: ${decade.currentAge}`,
    `Mệnh: ${chart.menh}`,
    `Thân: ${chart.than}`,
    `Cục: ${chart.cuc}`,
    `Bản mệnh: ${chart.banMenh}`,
    `Mệnh chủ: ${chart.menhChu}`,
    `Thân chủ: ${chart.thanChu}`,
    `Mệnh cục: ${chart.menhCucRelation}`,
    `Âm dương: ${chart.amDuong}`,
    `Cân lượng: ${chart.boneWeight?.label || "đang cập nhật"}`,
    `Lai nhân cung: ${chart.laiNhan || "đang cập nhật"}`,
    `Đại vận hiện tại: ${decade.current}`,
    menhPalace ? `Cung Mệnh: ${starsWithStates(chart, menhPalace.mainStars, menhPalace.name, "vô chính diệu")}` : "",
    thanPalace ? `Cung Thân: ${starsWithStates(chart, thanPalace.mainStars, thanPalace.name, "vô chính diệu")}` : "",
    `Tóm tắt engine: ${chart.summary.join(" ")}`,
  ].filter(Boolean);

  return `Bạn là chuyên gia tử vi Việt Nam. Viết phần luận giải tổng quan MIỄN PHÍ cho người đọc 30-60 tuổi, rõ ràng, nhẹ nhàng, không mê tín cực đoan.

Dữ liệu được phép dùng:
- ${mainEvidence.join("\n- ")}

Dữ liệu 12 cung đã an sao, dùng để hiểu tổng quan nhưng KHÔNG luận chi tiết từng cung trong bản miễn phí:
${compactPalaceContext(chart)}

Đại vận toàn cục:
${decade.allPeriods}

Yêu cầu:
- Không tự tính lại lá số, chỉ dùng dữ liệu trên.
- Đây là 1 prompt duy nhất cho bản miễn phí; hãy tự tổng hợp đủ thông tin từ dữ liệu đã cấp.
- Không hứa chắc kết quả, không dọa nạt.
- BẮT BUỘC viết từ ${FREE_OVERVIEW_MIN_WORDS} đến ${FREE_OVERVIEW_MAX_WORDS} từ tiếng Việt, không được trả lời ngắn và không vượt quá ${FREE_OVERVIEW_MAX_WORDS} từ.
- Mỗi mục chính tối thiểu 220 từ, có nội dung thực tế dựa trên lá số.
- Đây là bản miễn phí: chỉ nêu tổng quan và gợi ý đọc lá số, không luận chi tiết đủ 12 cung.
- Markdown đúng thứ tự:
  ## Tổng quan miễn phí
  ## Mệnh và Thân nói gì
  ## Điểm mạnh dễ phát huy
  ## Điều nên lưu ý
  ## Gợi ý cho năm ${chart.input.viewYear}
- Không kết thúc khi chưa đủ ${FREE_OVERVIEW_MIN_WORDS} từ.

QUY TẮC ĐỘ DÀI BẮT BUỘC GHI ĐÈ MỌI DÒNG KHÁC:
- Viết từ ${FREE_OVERVIEW_MIN_WORDS} đến ${FREE_OVERVIEW_MAX_WORDS} từ tiếng Việt.
- Không vượt quá ${FREE_OVERVIEW_MAX_WORDS} từ.
- Nếu các dòng trước có nhắc mốc ngắn hơn, bỏ qua mốc đó và tuân theo quy tắc này.`;
}

function fallbackFreeOverview(chart: TuViChart) {
  const menhPalace = chart.palaces.find((item) => item.name === "Mệnh");
  const thanPalace = palaceByName(chart, "Thân");
  const menhStars = menhPalace ? starsWithStates(chart, menhPalace.mainStars, menhPalace.name, "vô chính diệu") : "đang cập nhật";
  const thanStars = thanPalace ? starsWithStates(chart, thanPalace.mainStars, thanPalace.name, "vô chính diệu") : "đang cập nhật";

  return `## Tổng quan miễn phí
Lá số của ${chart.input.fullName} được lập theo năm xem ${chart.input.viewYear}. Phần miễn phí này giúp bạn nắm hướng đọc chính trước khi đi sâu vào từng cung và từng vận.

${chart.summary.join(" ")}

## Mệnh và Thân nói gì
- Mệnh thuộc ${chart.menh}, cục là ${chart.cuc}, âm dương là ${chart.amDuong}.
- Cung Mệnh có ${menhStars}. Đây là nhóm tín hiệu dùng để đọc khí chất, cách phản ứng và xu hướng phát triển ban đầu.
- ${chart.than} có ${thanStars}. Thân thường cho thấy môi trường hành động rõ hơn khi trưởng thành.

## Điểm mạnh dễ phát huy
- Nên phát huy những việc có kế hoạch rõ, làm từng bước và có kiểm chứng.
- Khi đã chọn được hướng chính, bạn dễ ổn định hơn nếu giữ nhịp làm việc đều.
- Các cung sáng trong lá số nên được xem như vùng có thể chủ động mở rộng.

## Điều nên lưu ý
- Tử vi nên được dùng như bản tham khảo để quản trị rủi ro, không phải kết luận tuyệt đối.
- Nếu gặp sao hãm, sát tinh hoặc vận khó, nên hiểu đó là lời nhắc để làm chậm lại, kiểm tra kỹ tiền bạc, giấy tờ và quan hệ.
- Tránh quyết định lớn khi cảm xúc đang mạnh hoặc thông tin chưa đủ rõ.

## Gợi ý cho năm ${chart.input.viewYear}
- Ưu tiên việc có nền tảng, có người hỗ trợ và có kế hoạch dự phòng.
- Việc mới nên thử nhỏ trước, sau đó mới mở rộng.
- Nếu muốn đọc sâu hơn, nên xem tiếp phần luận giải toàn bộ để nối Mệnh, Thân, 12 cung và vận hạn thành một bức tranh đầy đủ hơn.`;
}

export async function generateFreeOverview(chart: TuViChart) {
  const prompt = freeOverviewPrompt(chart);
  if (isLlmDisabledForSmoke()) return { content: fallbackFreeOverview(chart), model: "template-fallback", prompt };
  const routed = await generateWithLlmRouter({ prompt, maxTokens: FREE_OVERVIEW_MAX_TOKENS, temperature: 0.55 });
  if (routed) return { content: routed.text, model: routed.model, prompt };
  return { content: fallbackFreeOverview(chart), model: "template-fallback", prompt };
}

export function paidReadingChapters(chart: TuViChart, type: ReadingKey): PaidReadingChapter[] {
  const year = chart.input.viewYear;

  if (type !== "FULL") {
    return [
      {
        key: "context",
        title: "Chương 1: Dữ kiện và trọng tâm",
        requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
        instruction: "Giải thích phạm vi đang mở khóa, dữ kiện đã dùng, các sao/trạng thái nổi bật và ý nghĩa tổng quan của phần luận này.",
        targetWords: "700-1200 từ",
      },
      {
        key: "analysis",
        title: "Chương 2: Phân tích chính",
        requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
        instruction: "Đi sâu vào điểm thuận lợi, điểm cần quản trị, công việc và tiền bạc. Luôn bám vào cung/sao/vận hạn liên quan.",
        targetWords: "900-1500 từ",
      },
      {
        key: "advice",
        title: "Chương 3: Ứng dụng thực tế",
        requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
        instruction: "Viết lời khuyên dễ hiểu, có trách nhiệm, không hù dọa. Nêu việc nên làm, nên tránh và cách dùng thông tin này trong đời sống.",
        targetWords: "800-1300 từ",
      },
    ];
  }

  return [
    {
      key: "overview",
      title: "Chương 1: Tổng quan lá số",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Mở đầu báo cáo toàn bộ. Tóm tắt Mệnh, Thân, Cục, âm dương, cân lượng, đại vận hiện tại, lai nhân cung và các tín hiệu nổi bật nhất. Nhắc rõ 5 điểm định hướng chỉ là chỉ báo tham khảo.",
      targetWords: "900-1400 từ",
    },
    {
      key: "menh-than",
      title: "Chương 2: Mệnh, Thân và khí chất cốt lõi",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Phân tích Mệnh/Thân, chính tinh, phụ tinh, trạng thái Miếu/Vượng/Đắc/Bình/Hãm và cách các tín hiệu này thể hiện khí chất, cách ra quyết định, xu hướng trưởng thành.",
      targetWords: "1000-1500 từ",
    },
    {
      key: "twelve-palaces",
      title: "Chương 3: 12 cung trọng yếu",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận đủ 12 cung. Viết sâu hơn cho Mệnh, Thân, Quan Lộc, Tài Bạch, Phu Thê, Tật Ách, Thiên Di. Các cung còn lại viết ngắn hơn nhưng vẫn có ý nghĩa rõ.",
      targetWords: "1500-2200 từ",
    },
    {
      key: "career",
      title: "Chương 4: Công việc và định hướng sự nghiệp",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về khuynh hướng nghề nghiệp, cách làm việc, môi trường phù hợp, cơ hội thăng tiến, cách quản trị áp lực và điểm cần tránh trong năm xem.",
      targetWords: "900-1400 từ",
    },
    {
      key: "money",
      title: "Chương 5: Tài chính và cách quản trị tiền bạc",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về dòng tiền, thói quen tích lũy, rủi ro chi tiêu/đầu tư, cách kiểm soát nợ và cách quyết định tài chính thận trọng.",
      targetWords: "900-1400 từ",
    },
    {
      key: "relationship",
      title: "Chương 6: Tình cảm, hôn nhân, gia đình",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về quan hệ gia đình, hôn nhân, cách giao tiếp, cảm xúc, trách nhiệm và cách giữ hòa khí. Không phán cứng chuyện ly hợp hay mất mát.",
      targetWords: "900-1400 từ",
    },
    {
      key: "health",
      title: "Chương 7: Sức khỏe, tinh thần, nhịp sống",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về nhịp nghỉ ngơi, sức khỏe tinh thần, dấu hiệu quá tải, thói quen nên điều chỉnh. Ghi rõ không thay thế tư vấn y tế chuyên môn.",
      targetWords: "800-1200 từ",
    },
    {
      key: "yearly-months",
      title: `Chương 8: Vận hạn năm ${year} và gợi ý theo từng tháng`,
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: `Tổng hợp vận hạn năm ${year}, đại vận hiện tại, sao lưu niên và lời khuyên hành động. BẮT BUỘC có gợi ý đủ 12 tháng: mỗi tháng nêu trọng tâm, việc nên ưu tiên, việc nên tránh, lưu ý cảm xúc/sức khỏe/tài chính nếu cần.`,
      targetWords: "1500-2200 từ",
    },
  ];
}

export function paidReadingChapterPrompt(
  chart: TuViChart,
  type: ReadingKey,
  scopeKey: string,
  focus: ReturnType<typeof getFocusData>,
  chapter: PaidReadingChapter,
  index: number,
  total: number,
) {
  const summary = getDeepReadingSummary(chart);
  const scoreLines = summary.scores.map((score) => `${score.label}: ${score.value}/100`).join("; ");
  const sectionLines = chapter.requiredSections.map((section) => `## ${section}`).join("\n");

  return `Bạn là chuyên gia tử vi Việt Nam. Hãy viết ${chapter.title} (${index + 1}/${total}) cho báo cáo trả phí.

Loại luận: ${FEATURE_PRICES[type].label}
Phạm vi: ${scopeKey}
Người xem: ${chart.input.fullName}
Giới tính: ${chart.input.gender === "female" ? "Nữ" : "Nam"}
Tuổi theo năm xem: ${summary.age}
Xưng hô ưu tiên trong bài: ${summary.viewerAddress}
Năm xem: ${chart.input.viewYear}
Mục tiêu toàn bộ bản FULL/all: ${PAID_FULL_WORD_TARGET}; riêng chương này: ${chapter.targetWords}
Chiến lược prompt: ${PAID_READING_VERSION}
Điểm định hướng đầu báo cáo: ${scoreLines}
Trọng tâm dữ liệu: ${focus.title}

Dữ liệu nổi bật:
- ${focus.evidence.join("\n- ")}

Dữ kiện các cung trọng yếu:
${compactImportantPalaces(chart)}

Dữ liệu 12 cung đã an sao:
${compactPalaceContext(chart)}

Dữ liệu lá số JSON đầy đủ, chỉ dùng để đối chiếu bằng chứng, KHÔNG tự an sao lại:
${JSON.stringify(chart, null, 2)}

Yêu cầu bắt buộc:
- Chỉ viết chương này, không viết lại các chương khác.
- Không tự tính lại lá số, không đổi ngày giờ, không tự thêm sao ngoài JSON.
- Báo cáo toàn bộ phải tạo cảm giác an tâm, rõ ràng, đáng tiền cho người đọc 30-60 tuổi.
- Xưng hô tự nhiên theo dữ liệu: dùng "${summary.viewerAddress}" khi cần gọi trực tiếp người xem.
- Bắt đầu chương bằng đúng dòng Markdown: # ${chapter.title}
- Mỗi chương phải có đúng 4 heading dưới đây, đúng thứ tự:
${sectionLines}
- Trong "Dữ kiện lá số đã dùng": ghi ngắn cung/sao/trạng thái sao (M/V/Đ/B/H) và sao lưu niên/vận hạn liên quan.
- Trong "Luận giải chính": giải thích sâu, nhưng mỗi đoạn tối đa 3-4 dòng khi đọc trên điện thoại.
- Trong "Điều nên lưu ý": mọi sao hãm, sát tinh, lưu sát tinh phải chuyển thành lời khuyên quản trị rủi ro; không dọa, không kết luận tuyệt đối.
- Trong "Gợi ý hành động": dùng bullet rõ việc nên làm, nên tránh, nhịp kiểm tra lại.
- Nếu chương là vận năm, bắt buộc có đủ 12 tháng trong năm ${chart.input.viewYear}, mỗi tháng có trọng tâm, ưu tiên, điều nên tránh.
- Không dùng từ ngữ quá kỹ thuật hoặc quá mê tín. Viết như một chuyên gia đang tư vấn bình tĩnh cho người trưởng thành.

Trọng tâm chương:
${chapter.instruction}`;
}

function fallbackChapterBody(chart: TuViChart, chapter: PaidReadingChapter, focus?: ReturnType<typeof getFocusData>) {
  const summary = getDeepReadingSummary(chart);
  const focusPalaces = compactImportantPalaces(chart).split("\n").slice(0, 4).join("\n- ");
  const focusEvidence = focus ? focus.evidence.join("\n- ") : focusPalaces;
  const monthAdvice =
    chapter.key === "yearly-months"
      ? `\n\nGợi ý 12 tháng trong năm ${chart.input.viewYear}:\n${Array.from({ length: 12 }, (_, month) => {
          const label = `Tháng ${month + 1}`;
          const focus = month % 3 === 0 ? "ổn định công việc và giấy tờ" : month % 3 === 1 ? "giữ nhịp tài chính, tránh quyết định vội" : "chăm sóc quan hệ và sức khỏe tinh thần";
          return `- ${label}: trọng tâm là ${focus}; nên ưu tiên việc có kế hoạch rõ, tránh hứa hẹn quá sức và kiểm tra lại chi tiêu/cảm xúc trước quyết định lớn.`;
        }).join("\n")}`
      : "";

  return `# ${chapter.title}

## Dữ kiện lá số đã dùng
- Người xem: ${chart.input.fullName}, năm xem ${chart.input.viewYear}, tuổi ${summary.age}, xưng hô gợi ý: ${summary.viewerAddress}.
- Mệnh: ${chart.menh}; Thân: ${chart.than}; Cục: ${chart.cuc}; cân lượng: ${chart.boneWeight?.label || "đang cập nhật"}.
- Trọng tâm mở khóa: ${focus?.title || "Luận giải toàn bộ"}.
- Dữ kiện trọng yếu:
- ${focusEvidence}

## Luận giải chính
Chương này được dựng từ dữ liệu lá số đã tính sẵn, không tự an sao lại. Trọng tâm là đọc ${focus?.title || "các tín hiệu nổi bật"} theo hướng thực tế: phần thuận lợi dùng để phát huy, phần khó dùng để chuẩn bị và giảm rủi ro.

Với ${summary.viewerAddress} ${chart.input.fullName}, lá số nên được đọc như một bản định hướng. Những cung quan trọng cho thấy điều cần giữ là sự đều đặn, cách chọn môi trường phù hợp và khả năng kiểm tra lại các quyết định lớn trước khi hành động.

## Điều nên lưu ý
- Các sao hãm, sát tinh hoặc sao lưu có tính căng không nên hiểu là điều chắc chắn sẽ xảy ra. Chúng là tín hiệu nhắc ${summary.viewerAddress} làm chậm lại, kiểm tra kỹ tiền bạc, giấy tờ, sức khỏe và quan hệ.
- Không nên quyết định lớn khi thông tin chưa đủ rõ hoặc cảm xúc đang bị đẩy lên cao.
- Nếu một giai đoạn có nhiều áp lực, ưu tiên giữ nhịp sinh hoạt, ngủ nghỉ và kế hoạch dự phòng trước khi mở rộng việc mới.

## Gợi ý hành động
- Chọn 1-2 việc quan trọng nhất trong 30 ngày tới, làm rõ mục tiêu, người hỗ trợ và tiêu chí kiểm tra.
- Với tiền bạc, nên có hạn mức rủi ro và ghi lại dòng tiền trước khi cam kết lớn.
- Với quan hệ, nên nói rõ nhu cầu bằng lời nhẹ, tránh im lặng kéo dài thành hiểu nhầm.${monthAdvice}`;
}

function fallbackPaidReading(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const focus = getFocusData(chart, type, scopeKey);
  return paidReadingChapters(chart, type)
    .map((chapter) => fallbackChapterBody(chart, chapter, focus))
    .join("\n\n");
}

async function generateViaGateway(prompt: string, model: string) {
  if (!process.env.VERCEL_OIDC_TOKEN && !process.env.AI_GATEWAY_API_KEY) return null;

  try {
    const { generateText } = await import("ai");
    const result = await generateText({
      model,
      prompt,
      temperature: 0.55,
      maxOutputTokens: PAID_READING_CHAPTER_MAX_TOKENS,
    });
    return { content: result.text, model };
  } catch {
    return null;
  }
}

async function generatePaidChapter(prompt: string, gatewayModel: string) {
  const routed = await generateWithLlmRouter({
    prompt,
    maxTokens: PAID_READING_CHAPTER_MAX_TOKENS,
    temperature: 0.55,
  });
  if (routed) return { content: routed.text, model: routed.model };
  return generateViaGateway(prompt, gatewayModel);
}

export async function generateReading(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const gatewayModel = process.env.AI_MODEL || "openai/gpt-5.4";
  const focus = getFocusData(chart, type, scopeKey);
  const chapters = paidReadingChapters(chart, type);
  const summary = getDeepReadingSummary(chart);

  if (isLlmDisabledForSmoke() || (!hasExternalLlmProvider() && !process.env.VERCEL_OIDC_TOKEN && !process.env.AI_GATEWAY_API_KEY)) {
    return {
      content: fallbackPaidReading(chart, type, scopeKey),
      model: "template-fallback",
      prompt: JSON.stringify({
        strategy: PAID_READING_VERSION,
        fallback: true,
        reason: "no-provider",
        promptVersion: PAID_READING_VERSION,
        wordTarget: PAID_FULL_WORD_TARGET,
        chartEngineVersion: chart.engine?.version,
        viewYear: chart.input.viewYear,
        viewerAddress: summary.viewerAddress,
        scores: summary.scores,
        chapters: chapters.map((chapter) => ({ key: chapter.key, title: chapter.title, model: "template-fallback" })),
      }),
    };
  }

  const outputs: Array<{ key: string; title: string; content: string; model: string; prompt: string }> = [];

  for (const [index, chapter] of chapters.entries()) {
    const prompt = paidReadingChapterPrompt(chart, type, scopeKey, focus, chapter, index, chapters.length);
    const generated = await generatePaidChapter(prompt, gatewayModel);

    outputs.push({
      key: chapter.key,
      title: chapter.title,
      content: generated?.content?.trim() || fallbackChapterBody(chart, chapter, focus),
      model: generated?.content ? generated.model : "template-fallback",
      prompt,
    });
  }

  return {
    content: outputs.map((chapter) => chapter.content.trim()).join("\n\n"),
    model: Array.from(new Set(outputs.map((chapter) => chapter.model))).join(" + "),
    prompt: JSON.stringify({
      strategy: PAID_READING_VERSION,
      promptVersion: PAID_READING_VERSION,
      wordTarget: type === "FULL" ? PAID_FULL_WORD_TARGET : "theo phạm vi mở khóa",
      maxTokensPerChapter: PAID_READING_CHAPTER_MAX_TOKENS,
      chartEngineVersion: chart.engine?.version,
      chartEngineProfile: chart.engine?.starProfile,
      viewYear: chart.input.viewYear,
      viewerAddress: summary.viewerAddress,
      age: summary.age,
      scores: summary.scores,
      chapters: outputs.map((chapter) => ({
        key: chapter.key,
        title: chapter.title,
        model: chapter.model,
        prompt: chapter.prompt,
      })),
    }),
  };
}
