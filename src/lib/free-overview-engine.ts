import type { Palace, TuViChart } from "@/lib/chart";
import freeReadingBlocks from "../data/free-reading-blocks.json" with { type: "json" };

type FreeReadingBlock = {
  loi_the: string;
  rao_can: string;
  premium_hook: string;
};

type FreeReadingContentBlocks = {
  cung_menh: {
    chinh_tinh: Record<string, FreeReadingBlock>;
  };
  cung_tai_bach: {
    dong_tien_chinh: Record<string, FreeReadingBlock>;
  };
  cung_quan_loc: {
    moi_truong: Record<string, FreeReadingBlock>;
  };
  van_han: {
    nam: Record<string, FreeReadingBlock>;
  };
};

export const FREE_READING_CONTENT_BLOCKS = freeReadingBlocks as FreeReadingContentBlocks;

export type FreeReadingSignalSection = {
  key: "menh" | "tai_bach" | "quan_loc" | "van_han";
  palace: string;
  signalLabel: string;
  matchKey: string;
};

export type FreeReadingSignals = {
  profileName: string;
  lifeYearLabel: string;
  destinyLine: string;
  viewYear: number;
  viewYearCanChi: string;
  sections: FreeReadingSignalSection[];
};

export type FreeReadingSection = FreeReadingSignalSection & {
  title: string;
  blockLabel: string;
  freeText: string;
  premiumHook: string;
};

function chartAge(chart: TuViChart) {
  return chart.input.viewYear - chart.solar.year;
}

function palaceByName(chart: TuViChart, name: string) {
  if (name === "Thân") return chart.palaces.find((palace) => palace.isThan);
  return chart.palaces.find((palace) => palace.name === name);
}

function firstUsefulMainStar(palace?: Palace) {
  return palace?.mainStars.find((star) => star !== "Vô chính diệu") || palace?.supportStars[0] || "Tổng hợp";
}

function hasStar(palace: Palace | undefined, starName: string) {
  if (!palace) return false;
  return [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars].some((star) => star.includes(starName));
}

function normalizeKey(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gu, "d")
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
}

function blockOrDefault(collection: Record<string, FreeReadingBlock>, key: string) {
  return collection[key] || collection.default;
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

function yearCanChi(chart: TuViChart) {
  return chart.canChi?.year || String(chart.solar.year);
}

function viewYearCanChi(chart: TuViChart) {
  if (chart.input.viewYear === 2026) return "Bính Ngọ";
  return String(chart.input.viewYear);
}

function moneyMatchKey(taiBach?: Palace) {
  if (hasStar(taiBach, "Thiên Đồng") && hasStar(taiBach, "Thiên Lương")) return "dong_luong";
  if ((hasStar(taiBach, "Tử Vi") || hasStar(taiBach, "Tử")) && hasStar(taiBach, "Tham Lang")) return "tu_tham";
  return "default";
}

function careerMatchKey(quanLoc?: Palace) {
  if (hasStar(quanLoc, "Thái Âm") && hasStar(quanLoc, "Hóa Kỵ")) return "thai_am_hoa_ky";
  if (hasStar(quanLoc, "Thiên Tướng")) return "thien_tuong";
  return "default";
}

function yearMatchKey(chart: TuViChart) {
  return chart.input.viewYear === 2026 ? "binh_ngo_2026" : "default";
}

export function extractFreeReadingSignals(chart: TuViChart): FreeReadingSignals {
  const menh = palaceByName(chart, "Mệnh");
  const taiBach = palaceByName(chart, "Tài Bạch");
  const quanLoc = palaceByName(chart, "Quan Lộc");
  const decade = currentDecade(chart);
  const menhStar = firstUsefulMainStar(menh);

  return {
    profileName: chart.input.fullName,
    lifeYearLabel: `${yearCanChi(chart)} ${chart.solar.year}`,
    destinyLine: `${chart.menh} | Cục: ${chart.cuc}`,
    viewYear: chart.input.viewYear,
    viewYearCanChi: viewYearCanChi(chart),
    sections: [
      {
        key: "menh",
        palace: menh?.name || "Mệnh",
        signalLabel: menhStar,
        matchKey: FREE_READING_CONTENT_BLOCKS.cung_menh.chinh_tinh[normalizeKey(menhStar)] ? normalizeKey(menhStar) : "default",
      },
      {
        key: "tai_bach",
        palace: taiBach?.name || "Tài Bạch",
        signalLabel: moneyMatchKey(taiBach) === "dong_luong" ? "Đồng Lương" : moneyMatchKey(taiBach) === "tu_tham" ? "Tử Tham" : firstUsefulMainStar(taiBach),
        matchKey: moneyMatchKey(taiBach),
      },
      {
        key: "quan_loc",
        palace: quanLoc?.name || "Quan Lộc",
        signalLabel: careerMatchKey(quanLoc) === "thai_am_hoa_ky" ? "Thái Âm Hóa Kỵ" : firstUsefulMainStar(quanLoc),
        matchKey: careerMatchKey(quanLoc),
      },
      {
        key: "van_han",
        palace: decade?.palace || "Đại vận",
        signalLabel: chart.input.viewYear === 2026 ? "Lưu Thái Tuế và nhịp Bính Ngọ" : `Đại vận ${decade?.range || ""}`.trim(),
        matchKey: yearMatchKey(chart),
      },
    ],
  };
}

function sectionTitle(signal: FreeReadingSignalSection, viewYear: number, viewYearLabel: string) {
  if (signal.key === "menh") return "Năng lực thiên phú (Cung Mệnh)";
  if (signal.key === "tai_bach") return "Phong cách kiếm tiền (Cung Tài Bạch)";
  if (signal.key === "quan_loc") return "Môi trường làm việc lý tưởng (Cung Quan Lộc)";
  return `Vận hạn năm ${viewYear} (Năm ${viewYearLabel})`;
}

function blockForSignal(signal: FreeReadingSignalSection) {
  if (signal.key === "menh") return blockOrDefault(FREE_READING_CONTENT_BLOCKS.cung_menh.chinh_tinh, signal.matchKey);
  if (signal.key === "tai_bach") return blockOrDefault(FREE_READING_CONTENT_BLOCKS.cung_tai_bach.dong_tien_chinh, signal.matchKey);
  if (signal.key === "quan_loc") return blockOrDefault(FREE_READING_CONTENT_BLOCKS.cung_quan_loc.moi_truong, signal.matchKey);
  return blockOrDefault(FREE_READING_CONTENT_BLOCKS.van_han.nam, signal.matchKey);
}

export function buildFreeReadingSections(chart: TuViChart): FreeReadingSection[] {
  const signals = extractFreeReadingSignals(chart);

  return signals.sections.map((signal) => {
    const block = blockForSignal(signal);
    return {
      ...signal,
      title: sectionTitle(signal, signals.viewYear, signals.viewYearCanChi),
      blockLabel: signal.signalLabel,
      freeText: `${block.loi_the} ${block.rao_can}`,
      premiumHook: block.premium_hook,
    };
  });
}

function renderSection(section: FreeReadingSection, index: number) {
  return `## ${index + 1}. ${section.title}

[Block Nội dung - ${section.blockLabel}]:
${section.freeText}

🔒 Nâng cấp Premium để xem:

- ${section.premiumHook}`;
}

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const signals = extractFreeReadingSignals(chart);
  const sections = buildFreeReadingSections(chart);
  const age = chartAge(chart);

  return `# Bài mẫu luận giải miễn phí

Hồ sơ: ${signals.profileName} (${signals.lifeYearLabel})
Tuổi xem: ${age} tuổi trong năm ${signals.viewYear}
Bản Mệnh: ${signals.destinyLine}

Chào bạn, lá số Tử Vi của bạn là sự kết hợp của những mã năng lượng riêng. Bản miễn phí này không cố viết một bài dài dàn trải, mà lắp ghép các khối nội dung rõ ràng từ chính cung, sao và vận đang nổi bật trong lá số. Mục tiêu là để bạn thấy nhanh bốn điểm cốt lõi: năng lực thiên phú, phong cách kiếm tiền, môi trường làm việc hợp hơn và nhịp vận hạn của năm đang xem.

${sections.map(renderSection).join("\n\n")}

## KHAI MỞ BẢN ĐỒ ĐỘC BẢN CỦA RIÊNG BẠN

Bản xem trước này chỉ là phần đầu của những gì lá số đang chứa. Báo cáo FULL Premium đi sâu hơn vào 12 cung, đại vận, vận năm, lộ trình 12 tháng và kế hoạch hành động 90 ngày để biến các tín hiệu trên thành quyết định cụ thể hơn.

[ MỞ KHÓA BÁO CÁO FULL PREMIUM NGAY ]`;
}
