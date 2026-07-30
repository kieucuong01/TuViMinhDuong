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
  riskSignals: string[];
  premiumBenefits: string[];
};

const CAUTION_STAR_HINTS = [
  "Hóa Kỵ",
  "Kình Dương",
  "Đà La",
  "Địa Không",
  "Địa Kiếp",
  "Thiên Không",
  "Hỏa Tinh",
  "Linh Tinh",
  "Tuần",
  "Triệt",
];

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
  if (!palace) return `Dữ kiện cung ${fallbackName} trong lá số hiện chưa đủ để kết luận sâu, vì vậy nhận định này chỉ nên dùng như một hướng tự đối chiếu.`;
  const mainStars = starsWithStates(palace, palace.mainStars, "vô chính diệu", 2);
  const supportStars = starsWithStates(palace, palace.supportStars, "không có phụ tinh nổi bật", 2);
  const yearlyStars = palace.yearlyStars.length ? `; sao lưu ${starsWithStates(palace, palace.yearlyStars, "", 2)}` : "";
  return `Căn cứ trực tiếp là cung ${palace.name} tại ${palace.branch}: chính tinh ${mainStars}; phụ tinh ${supportStars}${yearlyStars}; vòng ${palace.lifecycle}.`;
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
  if (signal.key === "menh") return "Điểm mù nào khiến năng lực Mệnh bị dùng sai chỗ, và vai trò nào giúp bạn phát huy mà không phải gồng quá lâu?";
  if (signal.key === "tai_bach") return "Mốc nào trong 12 tháng tới nên giữ tiền, xoay vốn hoặc dừng một cam kết trước khi thành áp lực?";
  if (signal.key === "quan_loc") return "Môi trường nghề nào giúp bạn có quyền hạn rõ hơn, và dấu hiệu nào báo rằng trách nhiệm đang vượt khỏi phần được giao?";
  if (signal.key === "van_han") return "Tháng nào nên tiến, tháng nào cần chậm lại, và việc gì phải kiểm tra trước khi quyết định?";
  return block.premium_hook;
}

function relevantPalaceForSignal(chart: TuViChart, signal: FreeReadingSignalSection) {
  if (signal.key === "menh") return palaceByName(chart, "Mệnh");
  if (signal.key === "tai_bach") return palaceByName(chart, "Tài Bạch");
  if (signal.key === "quan_loc") return palaceByName(chart, "Quan Lộc");
  const decade = currentDecade(chart);
  return decade ? palaceByName(chart, decade.palace) : undefined;
}

function cautionSignals(palace: Palace | undefined) {
  if (!palace) return [];
  const stars = [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars];
  return stars
    .filter((star, index, values) => values.indexOf(star) === index)
    .filter((star) => CAUTION_STAR_HINTS.some((hint) => star.includes(hint)))
    .slice(0, 2);
}

function premiumBenefitsForSection(signal: FreeReadingSignalSection) {
  if (signal.key === "menh") {
    return ["Nối Mệnh - Thân - Cục với 12 cung để xác định cách dùng đúng năng lực cốt lõi."];
  }
  if (signal.key === "tai_bach") {
    return ["Lập lộ trình 12 tháng cho các mốc nên giữ tiền, thử nhỏ, xoay vốn hoặc kiểm tra lại cam kết."];
  }
  if (signal.key === "quan_loc") {
    return ["Chuyển tín hiệu nghề nghiệp thành kế hoạch 30/90 ngày, với vai trò và thứ tự ưu tiên rõ ràng."];
  }
  return ["Xem đủ 12 tháng, các điểm cần chậm lại, việc nên tận dụng và 3 câu hỏi riêng với Cố vấn AI."];
}

function riskContext(key: FreeReadingSignalSection["key"]) {
  if (key === "menh") return "cách phản ứng dễ căng hơn bình thường khi bạn bị thúc ép hoặc phải quyết định quá nhanh";
  if (key === "tai_bach") return "tiền bạc, giấy tờ hoặc một cam kết hợp tác cần được kiểm tra kỹ hơn trước khi xuống quyết định";
  if (key === "quan_loc") return "ranh giới quyền hạn dễ mờ đi, khiến công sức bỏ ra nhiều nhưng phần ghi nhận không tương xứng";
  return "nhịp năm có đoạn nên chậm lại để rà tiền bạc, giấy tờ, sức lực và các mối quan hệ quan trọng";
}

function cliffhangerForSection(key: FreeReadingSignalSection["key"]) {
  if (key === "menh") return "Phần còn bỏ ngỏ là ranh giới giữa một vai trò giúp bạn phát huy và một môi trường khiến chính thế mạnh ấy trở thành gánh nặng.";
  if (key === "tai_bach") return "Nút thắt nằm ở thời điểm: lúc nào nên giữ, lúc nào được phép xoay và cam kết nào cần dừng trước khi bào mòn tích lũy?";
  if (key === "quan_loc") return "Điều chưa thể kết luận ở đây là môi trường nào trao đúng quyền hạn, thay vì chỉ giao thêm trách nhiệm và áp lực.";
  return "Điểm cần dừng đúng lúc nằm ở vài tháng cụ thể: tiến sớm dễ phân tán, nhưng chậm quá lại có thể bỏ lỡ nhịp thuận.";
}

function selfCheckForSection(section: FreeReadingSection) {
  if (section.key === "menh") {
    return "Để tự đối chiếu, hãy nhìn lại ba việc gần đây bạn làm tốt nhất: việc nào đến từ khả năng quan sát, việc nào đến từ sự bền bỉ, và việc nào khiến bạn phải gồng quá lâu. Nếu cùng một thế mạnh vừa giúp bạn tiến lên vừa làm bạn mệt, đó là tín hiệu bản FULL cần nối thêm Mệnh - Thân - Cục và các cung còn lại.";
  }
  if (section.key === "tai_bach") {
    return "Với tiền bạc, đừng chỉ hỏi có kiếm được không; hãy hỏi tiền đến theo nhịp nào, có giữ được không, và cam kết nào đang lấy mất sự chủ động. Một lá số tốt về nguồn lực vẫn cần lịch kiểm tra dòng tiền, vì sai thời điểm thường nguy hiểm hơn sai ý tưởng.";
  }
  if (section.key === "quan_loc") {
    return "Trong công việc, hãy soi vào môi trường chứ không chỉ soi chức danh. Nếu bạn thường được giao trách nhiệm nhưng thiếu quyền quyết định, hoặc làm nhiều mà tiêu chuẩn ghi nhận không rõ, đây là điểm cần đọc kỹ trước khi đổi việc, nhận dự án hoặc mở hợp tác.";
  }
  return "Với vận năm, phần miễn phí chỉ cho biết hướng khí chính. Điều đáng theo dõi là tháng nào nên tiến, tháng nào nên giữ, và việc gì cần kiểm tra trước khi ký, chi tiền hoặc nhận thêm trách nhiệm. Đây là lý do lộ trình 12 tháng quan trọng hơn một lời phán chung chung.";
}

function openingPraise(chart: TuViChart) {
  const anchors = ["Điền Trạch", "Quan Lộc", "Tài Bạch"].map((name) => {
    const palace = palaceByName(chart, name);
    return `${name} có ${firstUsefulMainStar(palace)}${palace ? ` tại ${palace.branch}` : ""}`;
  });
  return `Điểm đáng ghi nhận nằm ở ba trục: ${anchors.join("; ")}. Đây là chất liệu để xây nền, tạo vị thế và quản trị nguồn lực. Phần dưới chỉ ra cách dùng cùng hai điểm dễ lệch.`;
}

export function buildFreeReadingSections(chart: TuViChart): FreeReadingSection[] {
  const signals = extractFreeReadingSignals(chart);
  const drafts = signals.sections.map((signal) => {
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
      riskSignals: cautionSignals(relevantPalaceForSignal(chart, signal)),
      premiumBenefits: premiumBenefitsForSection(signal),
    };
  });
  const featuredRisks = new Set(
    drafts
      .filter((section) => section.riskSignals.length > 0)
      .slice(0, 2)
      .map((section) => section.key),
  );

  return drafts.map((section) => ({
    ...section,
    riskSignals: featuredRisks.has(section.key) ? section.riskSignals : [],
  }));
}

function praiseLead(section: FreeReadingSection) {
  if (section.key === "menh") return "Ở Cung Mệnh, điểm sáng nằm ở cách bạn giữ nhịp.";
  if (section.key === "tai_bach") return "Với tiền bạc, bạn có chất liệu để tạo và giữ nguồn lực.";
  if (section.key === "quan_loc") return "Trong công việc, lợi thế rõ khi vai trò được đặt đúng chỗ.";
  return "Với vận năm, bạn vẫn có khoảng chủ động để chọn nhịp.";
}

function firstSentence(text: string) {
  return text.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim() || text.trim();
}

function teaseParagraph(section: FreeReadingSection, block: FreeReadingBlock) {
  if (section.riskSignals.length > 0) {
    return `Tuy vậy, ${section.riskSignals.join(" đi cùng ")} khiến phần này cần đọc chậm: ${riskContext(section.key)}. ${firstSentence(block.rao_can)} Mốc thời gian và cách giảm rủi ro riêng chưa được mở ở bản miễn phí.`;
  }
  return `Mặt trái xuất hiện khi thế mạnh này bị dùng quá mức. ${firstSentence(block.rao_can)} Đây là xu hướng để tự đối chiếu, không phải lời phán cố định.`;
}

function renderSection(section: FreeReadingSection, index: number) {
  const block = blockForSignal(section);
  const premiumBullets = [section.premiumHook, ...section.premiumBenefits].map((item) => `- ${item}`).join("\n");

  return `## ${index + 1}. ${section.title}

${praiseLead(section)} ${firstSentence(block.loi_the)}

${teaseParagraph(section, block)}

${section.evidenceText}

${selfCheckForSection(section)}

${section.practicalTip}

${cliffhangerForSection(section.key)}

🔒 Nâng cấp Premium để xem:

${premiumBullets}`;
}

export function buildFreeOverviewFromInterpretationRules(chart: TuViChart) {
  const signals = extractFreeReadingSignals(chart);
  const sections = buildFreeReadingSections(chart);
  const age = chartAge(chart);

  return `# Luận giải miễn phí dành cho ${signals.profileName}

Hồ sơ: ${signals.profileName} (${signals.lifeYearLabel})
Tuổi xem: ${age} tuổi trong năm ${signals.viewYear}
Bản Mệnh: ${signals.destinyLine}

${openingPraise(chart)} Đây là hướng tự soi, không phải bản án; hãy đối chiếu cảnh báo với hoàn cảnh thật.

${sections.map(renderSection).join("\n\n")}

## KHAI MỞ BẢN ĐỒ ĐỘC BẢN CỦA RIÊNG BẠN

Bốn phần miễn phí đã chỉ ra hướng chính. Bản FULL mở đúng các giá trị sau:

- Bản FULL 9 chương: Mệnh - Thân và 12 cung trọng yếu.
- Lộ trình 12 tháng: tháng tiến, tháng chậm, việc cần kiểm tra.
- Kế hoạch 30/90 ngày theo thứ tự hành động.
- 3 câu hỏi với Cố vấn AI.
- Mua một lần, đọc lại không phí.

[ MỞ KHÓA BÁO CÁO FULL PREMIUM NGAY ]`;
}
