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
  quickTake: string;
  evidenceText: string;
  practicalTip: string;
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

function starsWithStates(palace: Palace | undefined, stars: string[], fallback: string, limit = 5) {
  if (!palace) return fallback;
  const visible = stars
    .filter(Boolean)
    .filter((star, index, values) => values.indexOf(star) === index)
    .slice(0, limit)
    .map((star) => {
      const state = palace.starStates?.[star];
      return state ? `${star} (${state})` : star;
    });
  return visible.length ? visible.join(", ") : fallback;
}

function palaceEvidenceText(palace: Palace | undefined, fallbackName: string) {
  if (!palace) return `Dữ kiện cung ${fallbackName} chưa đủ trong lá số đã tính, nên phần này chỉ giữ ở mức định hướng chung.`;
  const mainStars = starsWithStates(palace, palace.mainStars, "vô chính diệu", 4);
  const supportStars = starsWithStates(palace, palace.supportStars, "không có phụ tinh nổi bật", 5);
  const yearlyStars = starsWithStates(palace, palace.yearlyStars, "không có sao lưu năm nổi bật", 4);
  return `Dữ kiện: cung ${palace.name} tại ${palace.branch}; chính tinh ${mainStars}; phụ tinh ${supportStars}; sao lưu ${yearlyStars}; vòng ${palace.lifecycle}.`;
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

function currentDecadeEvidenceText(chart: TuViChart) {
  const decade = currentDecade(chart);
  const decadePalace = decade ? palaceByName(chart, decade.palace) : undefined;
  const age = chartAge(chart);
  const palaceText = decadePalace ? palaceEvidenceText(decadePalace, decade.palace) : "Dữ kiện cung đại vận hiện tại chưa đủ trong lá số đã tính.";
  return `Năm ${chart.input.viewYear} đặt trên tuổi ${age}, đại vận ${decade?.range || "chưa xác định"} tại cung ${decade?.palace || "chưa xác định"}. ${palaceText}`;
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

function yearSignalLabel(chart: TuViChart) {
  const decade = currentDecade(chart);
  const decadePalace = decade ? palaceByName(chart, decade.palace) : undefined;
  const yearlySignal = decadePalace?.yearlyStars[0];
  if (yearlySignal) return `${yearlySignal} trong đại vận ${decade?.range || ""}`.trim();
  return `Đại vận ${decade?.range || "hiện tại"}`.trim();
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
        signalLabel: yearSignalLabel(chart),
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

function quickTakeForSection(chart: TuViChart, signal: FreeReadingSignalSection) {
  if (signal.key === "menh") {
    return `Cung Mệnh nhấn vào kiểu ra quyết định của bạn: ${signal.signalLabel} cho thấy nên dùng quan sát, bền bỉ và tự điều chỉnh trước bước lớn.`;
  }
  if (signal.key === "tai_bach") {
    return "Cung Tài Bạch cho thấy tiền nên đến từ cách tạo giá trị đều hơn là quyết định nóng; trọng tâm là giữ nhịp, kiểm tra và dừng đúng lúc.";
  }
  if (signal.key === "quan_loc") {
    return "Cung Quan Lộc gợi ý môi trường hợp với bạn cần vai trò rõ, tiêu chuẩn rõ và đủ khoảng trống để năng lực thật được nhìn thấy.";
  }
  return `Ở tuổi ${chartAge(chart)} trong năm ${chart.input.viewYear}, vận năm nên đọc như lịch điều phối: việc nào tiến, việc nào chậm và mốc nào cần tự kiểm tra.`;
}

function evidenceForSection(chart: TuViChart, signal: FreeReadingSignalSection) {
  if (signal.key === "menh") {
    const menh = palaceByName(chart, "Mệnh");
    const than = palaceByName(chart, "Thân");
    const thanText = than ? ` Thân cư tại cung ${than.name} bổ sung bối cảnh hành động thực tế.` : "";
    return `${palaceEvidenceText(menh, "Mệnh")} Mệnh/Thân/Cục: ${chart.menh} / ${chart.than} / ${chart.cuc}.${thanText}`;
  }
  if (signal.key === "tai_bach") return palaceEvidenceText(palaceByName(chart, "Tài Bạch"), "Tài Bạch");
  if (signal.key === "quan_loc") return palaceEvidenceText(palaceByName(chart, "Quan Lộc"), "Quan Lộc");
  return currentDecadeEvidenceText(chart);
}

function practicalTipForSection(signal: FreeReadingSignalSection) {
  if (signal.key === "menh") {
    return "Trong 7 ngày tới, chọn một quyết định đang treo, viết 2 phương án thực tế, rồi thử bước nhỏ nhất thay vì chờ dữ kiện hoàn hảo.";
  }
  if (signal.key === "tai_bach") {
    return "Tách tiền bắt buộc, tiền linh hoạt và tiền thử nghiệm; khoản chi hoặc hợp tác mới cần giới hạn vốn, thời gian và tiêu chí dừng.";
  }
  if (signal.key === "quan_loc") {
    return "Khi nhận việc hoặc đổi vai trò, hỏi rõ quyền hạn, người quyết định và thước đo kết quả; môi trường mơ hồ dễ làm bạn hao sức.";
  }
  return "Chọn một trọng tâm mỗi quý, rà soát hàng tháng và không mở cam kết lớn khi sức khỏe, giấy tờ hoặc dòng tiền chưa được kiểm tra.";
}

function shortPremiumHook(signal: FreeReadingSignalSection, block: FreeReadingBlock) {
  if (signal.key === "menh") return "Điểm mù nào khiến năng lực Mệnh bị dùng sai chỗ?";
  if (signal.key === "tai_bach") return "Mốc nào trong năm nên giữ tiền hoặc xoay vốn?";
  if (signal.key === "quan_loc") return "Môi trường nghề nào giúp bạn có quyền hạn rõ hơn?";
  if (signal.key === "van_han") return "Tháng nào nên tiến, tháng nào cần chậm lại?";
  return block.premium_hook;
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
      quickTake: quickTakeForSection(chart, signal),
      evidenceText: evidenceForSection(chart, signal),
      practicalTip: practicalTipForSection(signal),
      premiumHook: shortPremiumHook(signal, block),
    };
  });
}

function renderSection(section: FreeReadingSection, index: number) {
  return `## ${index + 1}. ${section.title}

[Block Nội dung - ${section.blockLabel}]:
**Đọc nhanh:** ${section.quickTake}

**Lợi thế nổi bật:** ${blockForSignal(section).loi_the}

**Điểm dễ vướng:** ${blockForSignal(section).rao_can}

**Vì sao có nhận định này:** ${section.evidenceText}

**Gợi ý thực tế:** ${section.practicalTip}

🔒 Nâng cấp Premium để xem:

- ${section.premiumHook}`;
}

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const signals = extractFreeReadingSignals(chart);
  const sections = buildFreeReadingSections(chart);
  const age = chartAge(chart);

  return `# Luận giải miễn phí dành cho ${signals.profileName}

Hồ sơ: ${signals.profileName} (${signals.lifeYearLabel})
Tuổi xem: ${age} tuổi trong năm ${signals.viewYear}
Bản Mệnh: ${signals.destinyLine}

Đây không phải đoạn luận chung. Bốn tín hiệu dưới đây được chọn từ cung Mệnh, Tài Bạch, Quan Lộc và vận năm trong chính lá số của bạn. Mỗi mục có đọc nhanh, lợi thế, điểm dễ vướng, bằng chứng đã dùng và một gợi ý thực tế để bạn tự đối chiếu ngay.

${sections.map(renderSection).join("\n\n")}

## KHAI MỞ BẢN ĐỒ ĐỘC BẢN CỦA RIÊNG BẠN

Bản FULL Premium nối 12 cung, vận năm, lộ trình 12 tháng và kế hoạch 90 ngày để làm rõ lợi thế nên dùng, rủi ro cần chặn và thời điểm đáng ưu tiên.

[ MỞ KHÓA BÁO CÁO FULL PREMIUM NGAY ]`;
}
