import type { Palace, TuViChart } from "@/lib/chart";
import { loadInterpretationRules } from "@/lib/interpretation-rules";
import freeReadingBlocks from "../data/free-reading-blocks.json" with { type: "json" };

type FreeReadingBlock = {
  loi_the: string;
  rao_can: string;
  premium_hook: string;
  self_check?: string;
  practical_tip?: string;
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
const interpretationRules = loadInterpretationRules();

export function freeLifeTopics(chart: TuViChart) {
  return ([
    { id: "tinh-duyen", palace: "Phu Thê", title: "Tình duyên", situation: "Hãy nhớ một lần bạn thấy khó nói ra điều mình mong ở người kia. Bạn đã nói thẳng điều mình cần, hay chờ họ tự nhận ra?", deeper: "Bản chuyên sâu đọc thêm Phu Thê cùng Mệnh và Phúc Đức để xem điều bạn cần ở một mối quan hệ và cách hai người có thể trao đổi khi khác ý." },
    { id: "gia-dinh", palace: "Phúc Đức", title: "Gia đình", situation: "Khi người nhà nhờ một việc, thử để ý phần nào bạn nhận vì muốn giúp và phần nào bạn nhận vì ngại làm họ buồn. Nếu đang quá sức, nói rõ phần mình làm được trước khi nhận lời.", deeper: "Bản chuyên sâu đi thêm vào Phụ Mẫu và Điền Trạch để bạn đối chiếu kỳ vọng của người thân, cách chia trách nhiệm và chuyện ổn định chỗ ở." },
    { id: "cong-viec", palace: "Quan Lộc", title: "Sự nghiệp và công danh", situation: "Nếu đang làm nhiều mà vẫn khó được ghi nhận, thử chọn một việc có kết quả rõ ràng và hỏi người giao việc họ dùng tiêu chí nào để đánh giá.", deeper: "Bản chuyên sâu đối chiếu Quan Lộc với Mệnh và Tài Bạch để xem môi trường làm việc, đường phát triển và cách tạo thu nhập có hỗ trợ nhau hay không." },
  ] as const).map(topic => {
    const palace = chart.palaces.find(item => item.name === topic.palace);
    const rule = interpretationRules.find(({ pattern }) => pattern.kind === "main-star-palace" &&
      pattern.palace === topic.palace && palace?.mainStars.includes(pattern.star));
    return {
      ...topic,
      body: rule?.summary ?? "",
      evidence: rule && palace && rule.pattern.kind === "main-star-palace"
        ? `${rule.pattern.star} ở cung ${palace.name} tại ${palace.branch}.`
        : "",
    };
  });
}

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
  if (signal.key === "van_han") {
    const rule = interpretationRules.find((item) => item.pattern.kind === "fate"
      && item.pattern.fate === "dai-van" && item.pattern.palace === signal.palace);
    if (rule) return {
      loi_the: firstSentence(rule.summary),
      rao_can: `${rule.cautionText} Riêng một cung đại vận chưa đủ để kết luận tháng nào thuận lợi hoặc sẽ xảy ra việc gì trong năm.`,
      premium_hook: rule.teaserQuestion,
      self_check: "Trong những việc đang theo đuổi, việc nào bạn muốn dành thêm một năm để làm, việc nào bạn chỉ tiếp tục vì đã lỡ bỏ nhiều công sức?",
      practical_tip: practicalTipForSection(signal),
    };
  }
  if (signal.matchKey === "default" && signal.key !== "van_han") {
    const rule = interpretationRules.find((item) => item.pattern.kind === "main-star-palace"
      && item.pattern.star === signal.signalLabel && item.pattern.palace === signal.palace);
    if (rule) return {
      loi_the: firstSentence(rule.summary),
      rao_can: rule.cautionText.replace(/có thể dễ/gu, "có thể"),
      premium_hook: signal.key === "menh"
        ? FREE_READING_CONTENT_BLOCKS.cung_menh.chinh_tinh.default.premium_hook
        : signal.key === "tai_bach"
          ? FREE_READING_CONTENT_BLOCKS.cung_tai_bach.dong_tien_chinh.default.premium_hook
          : FREE_READING_CONTENT_BLOCKS.cung_quan_loc.moi_truong.default.premium_hook,
      practical_tip: practicalTipForSection(signal),
    };
  }
  if (signal.key === "menh") return blockOrDefault(FREE_READING_CONTENT_BLOCKS.cung_menh.chinh_tinh, signal.matchKey);
  if (signal.key === "tai_bach") return blockOrDefault(FREE_READING_CONTENT_BLOCKS.cung_tai_bach.dong_tien_chinh, signal.matchKey);
  if (signal.key === "quan_loc") return blockOrDefault(FREE_READING_CONTENT_BLOCKS.cung_quan_loc.moi_truong, signal.matchKey);
  return blockOrDefault(FREE_READING_CONTENT_BLOCKS.van_han.nam, signal.matchKey);
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
    return ["Đối chiếu thêm cung Thân và các cung liên quan để xem cách bạn hành động có khác với điều bạn mong muốn không."];
  }
  if (signal.key === "tai_bach") {
    return ["Xem thêm công việc và các cam kết liên quan, kèm lộ trình 12 tháng để đối chiếu với kế hoạch thực tế."];
  }
  if (signal.key === "quan_loc") {
    return ["Gợi ý trong kế hoạch 30/90 ngày: việc gì nên trao đổi lại, học thêm hoặc thử thay đổi trước."];
  }
  return ["Đọc phân tích từng tháng và dùng 3 câu hỏi với Cố vấn AI để hỏi thêm về kế hoạch bạn quan tâm."];
}

function selfCheckForSection(section: FreeReadingSection) {
  const block = blockForSignal(section);
  if (block.self_check) return `Để tự đối chiếu: ${block.self_check}`;
  if (section.key === "menh") {
    return "Để tự đối chiếu, hãy nhớ một quyết định gần đây: bạn tự chọn vì thấy phù hợp, hay nhận lời vì ngại làm người khác thất vọng?";
  }
  if (section.key === "tai_bach") {
    return "Để tự đối chiếu, nhìn lại tháng vừa rồi: khoản nào khiến bạn thấy công sức được trả xứng đáng, khoản nào khiến bạn tiếc vì đã nhận lời quá nhanh?";
  }
  if (section.key === "quan_loc") {
    return "Để tự đối chiếu, nghĩ về ngày làm việc gần nhất: điều làm bạn mệt là việc khó, hay là phải chờ quyết định và sửa đi sửa lại vì yêu cầu không rõ?";
  }
  return "Để tự đối chiếu, chọn một việc bạn đang cân nhắc trong năm nay. Điều bạn còn thiếu để quyết định là tiền, thời gian, người hỗ trợ hay thông tin?";
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
      quickTake: firstSentence(block.loi_the),
      evidenceText: evidenceForSection(chart, signal),
      practicalTip: block.practical_tip || practicalTipForSection(signal),
      premiumHook: block.premium_hook,
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

function firstSentence(text: string) {
  return text.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim() || text.trim();
}

function renderSection(section: FreeReadingSection, index: number) {
  const block = blockForSignal(section);
  const premiumBullets = [section.premiumHook, ...section.premiumBenefits].map((item) => `- ${item}`).join("\n");

  return `## ${index + 1}. ${section.title}

${block.loi_the}

${block.rao_can}

Căn cứ từ lá số: ${section.evidenceText}${section.riskSignals.length ? ` Các sao cần đối chiếu thêm: ${section.riskSignals.join(", ")}.` : ""}

${selfCheckForSection(section)}

${section.practicalTip}

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

Vì sao có những việc bạn làm rất tốt, nhưng càng làm lại càng mệt? Vì sao cùng một công việc, đổi người cùng làm hoặc đổi cách giao việc lại cho kết quả khác? Bốn phần dưới giúp bạn đối chiếu cách ra quyết định, chuyện tiền bạc, công việc và năm ${signals.viewYear}. Hãy bắt đầu từ phần bạn đang quan tâm. Nhận định dựa trên lá số; điều nào không khớp với trải nghiệm của bạn thì không cần cố nhận là đúng.

${sections.map(renderSection).join("\n\n")}

## Đọc tiếp bản chuyên sâu

Bốn phần miễn phí đã chỉ ra hướng chính. Bản FULL mở đúng các giá trị sau:

- Bản FULL 9 chương: Mệnh - Thân và 12 cung trọng yếu.
- Lộ trình 12 tháng: tháng tiến, tháng chậm, việc cần kiểm tra.
- Kế hoạch 30/90 ngày theo thứ tự hành động.
- 3 câu hỏi với Cố vấn AI.
- Mua một lần, đọc lại không phí.

[ Xem bản chuyên sâu khi bạn muốn tìm hiểu thêm. ]`;
}
