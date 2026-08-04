import { generateTuViChart, type ChartInput, type Palace, type TuViChart } from "@/lib/chart";
import {
  buildThemeNarrative,
  NarrativeLedger,
  type InteractionKind,
  type NarrativeProfile,
  type NarrativeTrait as ReadingTrait,
} from "@/lib/chart-compatibility-narrative";

export type CompatibilityLevel = "flow" | "coordinate" | "discuss";
export type CompatibilityThemeKey = "temperament" | "communication" | "commitment" | "finance" | "work" | "family";

export type CompatibilityEvidence = {
  personName: string;
  palaces: string[];
  details: string[];
};

export type ChartCompatibilityTheme = {
  key: CompatibilityThemeKey;
  title: string;
  level: CompatibilityLevel;
  levelLabel: string;
  summary: string;
  whyItMatters: string;
  possibleExpression: string;
  actions: string[];
  questions: string[];
  evidence: CompatibilityEvidence[];
};

export type ChartCompatibilityReport = {
  people: {
    name: string;
    canChiYear: string;
    banMenh: string;
    menh: string;
    than: string;
    cuc: string;
  }[];
  overview: {
    level: CompatibilityLevel;
    levelLabel: string;
    title: string;
    summary: string;
    strengths: string[];
    attention: string[];
  };
  elementReading: string;
  themes: ChartCompatibilityTheme[];
  sharedQuestions: string[];
  methodology: string;
  disclaimer: string;
};

type ThemeConfig = {
  key: CompatibilityThemeKey;
  title: string;
  palaces: string[];
  focus: string;
  expressions: Record<CompatibilityLevel, string>;
  actions: string[];
  questions: string[];
};

const LEVEL_LABELS: Record<CompatibilityLevel, string> = {
  flow: "Thuận để phát huy",
  coordinate: "Cần chủ động phối hợp",
  discuss: "Nên trao đổi rõ",
};

const STAR_TRAITS: Partial<Record<string, ReadingTrait[]>> = {
  "Tử Vi": ["leadership", "stability"],
  "Thiên Cơ": ["analysis", "change"],
  "Thái Dương": ["leadership", "expression"],
  "Vũ Khúc": ["action", "stability"],
  "Thiên Đồng": ["emotion", "change"],
  "Liêm Trinh": ["action", "expression"],
  "Thiên Phủ": ["leadership", "stability"],
  "Thái Âm": ["analysis", "emotion"],
  "Tham Lang": ["expression", "change"],
  "Cự Môn": ["analysis", "expression"],
  "Thiên Tướng": ["leadership", "emotion"],
  "Thiên Lương": ["analysis", "stability"],
  "Thất Sát": ["action", "change"],
  "Phá Quân": ["action", "change"],
};

const COMPLEMENTARY_TRAITS: [ReadingTrait, ReadingTrait][] = [
  ["analysis", "action"],
  ["leadership", "emotion"],
  ["stability", "change"],
  ["expression", "analysis"],
];

const SUPPORT_STAR_HINTS = ["Tả Phù", "Hữu Bật", "Thiên Khôi", "Thiên Việt", "Văn Xương", "Văn Khúc", "Hóa Lộc", "Hóa Khoa", "Hóa Quyền", "Thiên Giải", "Địa Giải", "Thiên Phúc"];
const CAUTION_STAR_HINTS = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp", "Hóa Kỵ", "Tang Môn", "Thiên Hư", "Thiên Khốc", "Tuần", "Triệt"];

type NarrativeTraitDetail = {
  primaryNeed: string;
  reassurance: string;
  contribution: string;
  friction: string;
};

const TRAIT_NARRATIVE_DETAILS: Record<ReadingTrait, NarrativeTraitDetail> = {
  leadership: {
    primaryNeed: "biết rõ vai trò và hướng đi",
    reassurance: "được chủ động trong phần trách nhiệm của mình",
    contribution: "đặt hướng, quy tụ và giữ trục cho việc chung",
    friction: "ôm quyền quyết định khi cảm thấy mọi thứ thiếu trật tự",
  },
  analysis: {
    primaryNeed: "có đủ dữ kiện trước khi chốt",
    reassurance: "được dành thời gian để hiểu kỹ vấn đề",
    contribution: "nhìn ra chi tiết và những điểm còn bỏ ngỏ",
    friction: "chậm chốt khi thông tin chưa đủ rõ",
  },
  action: {
    primaryNeed: "thấy sự việc thật sự tiến lên",
    reassurance: "có một bước tiếp theo cụ thể",
    contribution: "biến ý tưởng thành hành động và giữ đà tiến",
    friction: "sốt ruột khi phải chờ quá lâu",
  },
  expression: {
    primaryNeed: "được nói rõ quan điểm và nhận phản hồi",
    reassurance: "biết rằng lời mình nói đã được tiếp nhận",
    contribution: "gọi tên vấn đề và đưa điều khó nói ra ánh sáng",
    friction: "nói nhiều hơn khi cảm thấy mình chưa được nghe",
  },
  emotion: {
    primaryNeed: "cảm thấy an toàn trong bầu không khí giữa hai người",
    reassurance: "nhận được sự quan tâm qua thái độ và những việc nhỏ",
    contribution: "nhận ra cảm xúc và giữ sự kết nối",
    friction: "thu mình khi bầu không khí trở nên lạnh hoặc căng",
  },
  stability: {
    primaryNeed: "có một nhịp sống và nguyên tắc đủ ổn định",
    reassurance: "thấy lời hứa được chuyển thành việc làm đều đặn",
    contribution: "giữ nền nếp, trách nhiệm và tính liên tục",
    friction: "khó đổi cách làm khi sự thay đổi đến quá đột ngột",
  },
  change: {
    primaryNeed: "có khoảng linh hoạt để điều chỉnh cách làm",
    reassurance: "được thử một hướng mới mà vẫn có đường lui",
    contribution: "mở phương án và thích nghi khi bối cảnh đổi",
    friction: "đổi hướng nhanh khi thấy cách cũ không còn hiệu quả",
  },
};

const DEFAULT_NARRATIVE_DETAIL: NarrativeTraitDetail = {
  primaryNeed: "được hiểu trong đúng hoàn cảnh",
  reassurance: "hai bên nói rõ kỳ vọng trước khi kết luận",
  contribution: "quan sát tình huống theo một góc riêng",
  friction: "khó diễn đạt hết điều mình cần khi đang chịu áp lực",
};

const THEME_FALLBACK_DETAILS: Record<CompatibilityThemeKey, NarrativeTraitDetail> = {
  temperament: {
    primaryNeed: "được hiểu đúng trạng thái trước khi bị đánh giá",
    reassurance: "có một khoảng dừng vừa đủ để lấy lại cân bằng",
    contribution: "nhìn tình huống qua một nhịp phản ứng riêng",
    friction: "khó nói đúng nhu cầu khi cảm xúc đang dâng cao",
  },
  communication: {
    primaryNeed: "có đủ lượt để nói trọn điều quan trọng",
    reassurance: "người nghe xác nhận điều mình vừa tiếp nhận",
    contribution: "đưa thêm một góc nhìn cho cuộc trao đổi",
    friction: "dễ phòng thủ khi thông điệp bị hiểu lệch",
  },
  commitment: {
    primaryNeed: "nhìn thấy sự có mặt qua hành động đều đặn",
    reassurance: "kỳ vọng gắn bó được gọi thành lời",
    contribution: "thể hiện trách nhiệm theo cách riêng",
    friction: "khép lại khi cảm thấy nỗ lực của mình không được nhận ra",
  },
  finance: {
    primaryNeed: "thấy rõ con số và giới hạn trách nhiệm",
    reassurance: "quyền tự chủ được bảo vệ trong thỏa thuận chung",
    contribution: "đem một tiêu chí riêng vào quyết định nguồn lực",
    friction: "chần chừ khi rủi ro và quyền chốt còn mơ hồ",
  },
  work: {
    primaryNeed: "biết phần việc và tiêu chuẩn hoàn thành của mình",
    reassurance: "quyền hạn đi cùng trách nhiệm đã nhận",
    contribution: "giữ một mắt xích cần thiết trong quy trình",
    friction: "mất đà khi điểm bàn giao không rõ",
  },
  family: {
    primaryNeed: "hiểu giới hạn giữa nghĩa vụ và lựa chọn riêng",
    reassurance: "việc chăm sóc được phân chia thành phần cụ thể",
    contribution: "mang một nền nếp riêng vào đời sống chung",
    friction: "gồng lên khi kỳ vọng của người thân lấn át thỏa thuận đôi bên",
  },
};

const THEME_CONFIGS: ThemeConfig[] = [
  {
    key: "temperament",
    title: "Nhịp tính cách và cách phản ứng",
    palaces: ["Mệnh", "Phúc Đức"],
    focus: "Mệnh cho thấy cách mỗi người tiếp nhận và phản ứng; Phúc Đức bổ sung nền tinh thần, gia phong và điều giúp họ lấy lại cân bằng.",
    expressions: {
      flow: "Hai nhịp có điểm nhận ra nhau khá nhanh. Khi một người lên tiếng hoặc hành động, người kia thường hiểu được động cơ phía sau; lợi thế này phát huy tốt nhất khi cả hai vẫn cho nhau quyền khác biệt.",
      coordinate: "Hai người có chất liệu bổ sung nhưng tốc độ xử lý không hoàn toàn giống nhau. Một bên có thể muốn chốt sớm trong khi bên kia cần thêm thời gian; thống nhất cách báo trước và thời gian suy nghĩ sẽ giảm hiểu nhầm.",
      discuss: "Khác biệt dễ lộ rõ lúc mệt, bị thúc ép hoặc cùng muốn kiểm soát tình huống. Điều cần làm không phải ép một người đổi tính, mà nhận diện dấu hiệu quá tải và thống nhất cách tạm dừng trước khi câu chuyện đi quá xa.",
    },
    actions: ["Mỗi người nói rõ mình thường cần gì khi căng thẳng: khoảng lặng, thông tin, lời trấn an hay một kế hoạch cụ thể.", "Thống nhất một tín hiệu tạm dừng và thời điểm quay lại cuộc nói chuyện, tránh im lặng không thời hạn."],
    questions: ["Khi có việc bất ngờ, ai thường muốn hành động trước và ai cần hiểu đủ mới yên tâm?", "Cách nào giúp mỗi người cảm thấy được tôn trọng mà không phải từ bỏ nhịp riêng?"],
  },
  {
    key: "communication",
    title: "Giao tiếp, lắng nghe và giải quyết bất đồng",
    palaces: ["Mệnh", "Nô Bộc", "Thiên Di"],
    focus: "Mệnh nói về giọng phản ứng cá nhân; Nô Bộc và Thiên Di cho thấy cách kết nối, cộng tác và thể hiện mình khi bước ra môi trường bên ngoài.",
    expressions: {
      flow: "Hai người có một số điểm chung trong cách trao đổi nên dễ bắt được ý chính của nhau. Dù vậy, sự ăn ý chỉ bền khi câu hỏi, kỳ vọng và giới hạn vẫn được nói thành lời thay vì dựa vào đoán ý.",
      coordinate: "Một người có thể chú trọng nội dung và giải pháp, người kia chú trọng thái độ cùng cảm giác được lắng nghe. Nếu tách hai lượt — nghe cho đủ rồi mới bàn cách xử lý — cuộc trao đổi thường rõ hơn và ít phòng thủ hơn.",
      discuss: "Bất đồng dễ biến thành tranh luận về cách nói thay vì vấn đề ban đầu. Hai người nên tránh dùng im lặng, mỉa mai hoặc nhắc lại lỗi cũ như công cụ gây sức ép; hãy chốt từng việc, từng mốc và một đề nghị cụ thể.",
    },
    actions: ["Dùng cấu trúc: việc đã xảy ra — cảm nhận — điều tôi cần — đề nghị cụ thể, không gắn nhãn tính cách của đối phương.", "Với quyết định quan trọng, ghi lại phần đã đồng ý và phần còn mở để lần sau không tranh luận lại từ đầu."],
    questions: ["Mỗi người thấy mình được lắng nghe qua lời nói, thời gian hay hành động cụ thể?", "Khi chưa đồng ý, hai người muốn tiếp tục ngay hay hẹn lại sau bao lâu?"],
  },
  {
    key: "commitment",
    title: "Tình cảm, sự gần gũi và cam kết",
    palaces: ["Phu Thê", "Phúc Đức"],
    focus: "Phu Thê được đọc cùng Phúc Đức để nhìn kỳ vọng về người đồng hành, mức độ gắn bó và ảnh hưởng của nền gia đình; một cung riêng lẻ không đủ kết luận chất lượng quan hệ.",
    expressions: {
      flow: "Hai lá số có những tín hiệu giúp việc thể hiện trách nhiệm và quan tâm dễ gặp nhau. Điểm thuận này nên được chuyển thành thói quen có thật — thời gian dành cho nhau, lời hứa vừa sức và cách sửa sai rõ ràng.",
      coordinate: "Hai người có thể cùng muốn gắn bó nhưng định nghĩa về quan tâm hoặc trách nhiệm khác nhau. Nói rõ tần suất gặp gỡ, mức chia sẻ đời tư và ranh giới với gia đình hai bên sẽ hữu ích hơn việc thử lòng.",
      discuss: "Chủ đề cam kết dễ chạm vào nỗi lo bị kiểm soát, bị bỏ quên hoặc phải gánh quá nhiều. Đừng dùng lá số để quy lỗi; hãy quan sát hành vi lặp lại, khả năng nhận trách nhiệm và mức an toàn thực tế trong quan hệ.",
    },
    actions: ["Thống nhất ba điều mỗi người xem là biểu hiện của sự cam kết và ba ranh giới không nên vượt qua.", "Định kỳ hỏi lại kỳ vọng vì công việc, gia đình và sức khỏe có thể làm nhu cầu gắn bó thay đổi."],
    questions: ["Cam kết với mỗi người được đo bằng lời nói, thời gian, tài chính hay trách nhiệm nào?", "Ranh giới nào với bạn bè và gia đình hai bên cần thống nhất sớm?"],
  },
  {
    key: "finance",
    title: "Tiền bạc, tích lũy và quyết định chung",
    palaces: ["Tài Bạch", "Điền Trạch"],
    focus: "Tài Bạch cho thấy cách tạo và dùng nguồn lực; Điền Trạch bổ sung nhu cầu ổn định, nhà cửa và tài sản chung. Đây là gợi ý đối thoại, không phải khuyến nghị đầu tư.",
    expressions: {
      flow: "Hai người có điểm thuận trong cách nhìn nguồn lực hoặc mục tiêu ổn định. Lợi thế chỉ thành kết quả khi có con số, quyền quyết định và giới hạn rủi ro rõ; cảm giác hợp nhau không thay được ngân sách thực tế.",
      coordinate: "Một người có thể ưu tiên an toàn và tích lũy, người kia linh hoạt hơn với trải nghiệm hoặc cơ hội. Hai nhịp vẫn phối hợp được nếu tách quỹ bắt buộc, quỹ cá nhân và quỹ thử nghiệm thay vì dùng một nguyên tắc cho mọi khoản tiền.",
      discuss: "Tiền bạc có thể trở thành nơi tích tụ quyền lực, sự thiếu tin tưởng hoặc áp lực gia đình. Mọi khoản vay, đứng tên, góp vốn và nghĩa vụ với người thân cần được nói rõ bằng số liệu, giấy tờ và phương án dừng.",
    },
    actions: ["Lập ba ngăn: chi phí chung bắt buộc, tiền cá nhân tự quyết và quỹ mục tiêu; thống nhất ngưỡng phải hỏi nhau trước khi chi.", "Với vay nợ hoặc đầu tư chung, ghi rõ người chịu trách nhiệm, mức lỗ chấp nhận và cách thoát khỏi cam kết."],
    questions: ["Khoản nào là trách nhiệm chung, khoản nào mỗi người có quyền tự quyết?", "Nếu thu nhập giảm hoặc phát sinh nghĩa vụ gia đình, thứ tự ưu tiên sẽ thay đổi thế nào?"],
  },
  {
    key: "work",
    title: "Công việc, hợp tác và phân vai",
    palaces: ["Quan Lộc", "Thiên Di", "Nô Bộc"],
    focus: "Quan Lộc nói về trách nhiệm và cách tạo giá trị; Thiên Di, Nô Bộc bổ sung môi trường, quan hệ xã hội và cách hai người phối hợp khi có áp lực bên ngoài.",
    expressions: {
      flow: "Hai người có khả năng nhận ra thế mạnh công việc của nhau và tạo nhịp hỗ trợ tốt. Khi hợp tác, nên phân vai theo năng lực thực tế rồi duy trì điểm kiểm tra; đừng để người làm nhanh tự nhiên gánh luôn phần quyết định.",
      coordinate: "Phong cách làm việc có thể bổ sung — một bên mở đường, bên kia kiểm tra hoặc giữ nhịp — nhưng dễ va nếu quyền hạn không rõ. Mỗi việc cần một người chốt, một thời hạn và tiêu chuẩn hoàn thành cụ thể.",
      discuss: "Áp lực thành tích hoặc khác biệt về tốc độ dễ kéo mâu thuẫn công việc vào đời sống riêng. Nếu cùng làm ăn, càng cần hợp đồng, báo cáo tiền và cơ chế xử lý bất đồng như với một đối tác độc lập.",
    },
    actions: ["Phân vai bằng ba cột: người quyết định, người thực hiện, người cần được tham khảo; không để trách nhiệm nằm ở cả hai nhưng quyền quyết định không thuộc ai.", "Tách cuộc họp công việc khỏi thời gian riêng và chốt giờ dừng để quan hệ không bị công việc chiếm toàn bộ."],
    questions: ["Ai phù hợp mở việc, ai kiểm tra chi tiết và ai chốt quyết định cuối?", "Nếu kết quả không đạt, hai người đánh giá quy trình hay đổ lỗi cho tính cách?"],
  },
  {
    key: "family",
    title: "Gia đình, đời sống chung và kế hoạch dài hạn",
    palaces: ["Phúc Đức", "Phụ Mẫu", "Tử Tức"],
    focus: "Phúc Đức, Phụ Mẫu và Tử Tức giúp đặt quan hệ vào nền gia đình, trách nhiệm chăm sóc và cách xây một nhịp sống chung; hoàn cảnh thật luôn quan trọng hơn ký hiệu trên lá số.",
    expressions: {
      flow: "Hai người có một số điểm thuận về nhu cầu xây nền hoặc chăm lo cho người thân. Nên dùng điểm thuận để tạo nguyên tắc sống chung cụ thể, đồng thời giữ ranh giới để trách nhiệm với gia đình không làm mất phần riêng của quan hệ.",
      coordinate: "Nền gia đình và cách thể hiện bổn phận có thể khác nhau. Việc ai chăm cha mẹ, sống ở đâu, có con hay không và phân chia việc nhà cần được bàn theo từng giai đoạn, không mặc định một người phải tự hiểu.",
      discuss: "Áp lực từ gia đình, con cái hoặc nơi ở dễ làm hai người đứng về hai phía. Cần tách mong muốn cá nhân khỏi kỳ vọng của người thân, xác định điều có thể thương lượng và điều thuộc ranh giới an toàn của mỗi người.",
    },
    actions: ["Lập danh sách trách nhiệm với hai bên gia đình theo thời gian, tiền bạc và người xử lý; rà lại khi hoàn cảnh thay đổi.", "Thống nhất nguyên tắc việc nhà, nơi ở, quyền riêng tư và cách ra quyết định liên quan con cái trước các mốc lớn."],
    questions: ["Kỳ vọng nào đến từ chính hai người và kỳ vọng nào đến từ gia đình xung quanh?", "Khi trách nhiệm chăm sóc tăng, thời gian và tiền bạc sẽ được phân chia ra sao?"],
  },
];

function validateInput(input: ChartInput) {
  if (!input.fullName?.trim() || input.fullName.trim().length > 80) throw new Error("INVALID_NAME");
  if (input.gender !== "male" && input.gender !== "female") throw new Error("INVALID_GENDER");
  if (input.calendarType !== "solar" && input.calendarType !== "lunar") throw new Error("INVALID_CALENDAR_TYPE");
  if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100) throw new Error("INVALID_BIRTH_YEAR");
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) throw new Error("INVALID_BIRTH_DATE");
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > (input.calendarType === "lunar" ? 30 : 31)) throw new Error("INVALID_BIRTH_DATE");
  if (!Number.isInteger(input.birthHour) || input.birthHour < 0 || input.birthHour > 23) throw new Error("INVALID_BIRTH_HOUR");

  if (input.calendarType === "solar") {
    const date = new Date(Date.UTC(input.year, input.month - 1, input.day));
    if (date.getUTCFullYear() !== input.year || date.getUTCMonth() !== input.month - 1 || date.getUTCDate() !== input.day) {
      throw new Error("INVALID_BIRTH_DATE");
    }
  }
}

function palaceByName(chart: TuViChart, name: string) {
  return chart.palaces.find((palace) => palace.name === name);
}

function allStars(palace: Palace) {
  return [...palace.mainStars, ...palace.supportStars];
}

function traitsForPalaces(chart: TuViChart, palaceNames: string[]) {
  const counts = new Map<ReadingTrait, number>();
  palaceNames.forEach((name) => {
    const palace = palaceByName(chart, name);
    if (!palace) return;
    palace.mainStars.forEach((star) => {
      Object.entries(STAR_TRAITS).forEach(([knownStar, traits]) => {
        if (!star.includes(knownStar)) return;
        traits?.forEach((trait) => counts.set(trait, (counts.get(trait) || 0) + 1));
      });
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "vi")).map(([trait]) => trait);
}

function elementOf(chart: TuViChart) {
  return (["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"] as const).find((element) => chart.banMenh.includes(element)) || "Chưa rõ";
}

function elementRelation(first: TuViChart, second: TuViChart) {
  const a = elementOf(first);
  const b = elementOf(second);
  const generates: Record<string, string> = { Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc" };
  const controls: Record<string, string> = { Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc" };
  if (a === "Chưa rõ" || b === "Chưa rõ") return { score: 0, text: `Bản mệnh ${first.input.fullName} là ${first.banMenh}; ${second.input.fullName} là ${second.banMenh}. Cần đặt ngũ hành cạnh toàn bộ cung sao, không dùng riêng để kết luận.` };
  if (a === b) return { score: 2, text: `Hai bản mệnh cùng hành ${a}. Điểm giống giúp dễ hiểu cách ưu tiên của nhau, nhưng cũng có thể làm một phản ứng bị khuếch đại khi cả hai cùng căng.` };
  if (generates[a] === b || generates[b] === a) return { score: 1, text: `Hai bản mệnh ${a} và ${b} nằm trong quan hệ tương sinh. Đây là nền hỗ trợ để phối hợp, nhưng hiệu quả vẫn phụ thuộc cung Phu Thê, Phúc Đức và cách hai người hành xử.` };
  if (controls[a] === b || controls[b] === a) return { score: -1, text: `Hai bản mệnh ${a} và ${b} có quan hệ tương khắc theo ngũ hành. Nên hiểu đây là khác biệt cần điều tiết, không phải dấu hiệu buộc quan hệ xấu hoặc nên dừng.` };
  return { score: 0, text: `Hai bản mệnh ${a} và ${b} không tạo một kết luận riêng đủ mạnh. Phần có giá trị hơn nằm ở cách các cung Mệnh, Phu Thê, Tài Bạch và Phúc Đức của hai lá số tương tác.` };
}

function signalBalance(chart: TuViChart, palaceNames: string[]) {
  const stars = palaceNames.flatMap((name) => {
    const palace = palaceByName(chart, name);
    return palace ? allStars(palace) : [];
  });
  const support = stars.filter((star) => SUPPORT_STAR_HINTS.some((hint) => star.includes(hint))).length;
  const caution = stars.filter((star) => CAUTION_STAR_HINTS.some((hint) => star.includes(hint))).length;
  return Math.max(-2, Math.min(1, support - caution));
}

function hasComplement(first: ReadingTrait[], second: ReadingTrait[]) {
  return COMPLEMENTARY_TRAITS.some(([left, right]) =>
    (first.includes(left) && second.includes(right)) || (first.includes(right) && second.includes(left)),
  );
}

function compatibilityLevel(score: number): CompatibilityLevel {
  if (score >= 3) return "flow";
  if (score >= 0) return "coordinate";
  return "discuss";
}

function starList(palace: Palace, stars: string[], fallback: string, limit: number) {
  const visible = stars.slice(0, limit).map((star) => {
    const state = palace.starStates?.[star];
    return state ? `${star} (${state})` : star;
  });
  return visible.length ? visible.join(", ") : fallback;
}

function evidenceFor(chart: TuViChart, config: ThemeConfig): CompatibilityEvidence {
  const palaces = config.palaces.map((name) => palaceByName(chart, name)).filter((palace): palace is Palace => Boolean(palace));
  return {
    personName: chart.input.fullName,
    palaces: palaces.map((palace) => palace.name),
    details: palaces.map((palace) =>
      `cung ${palace.name} tại ${palace.branch}: chính tinh ${starList(palace, palace.mainStars, "Vô chính diệu", 3)}; phụ tinh ${starList(palace, palace.supportStars, "không có phụ tinh nổi bật", 3)}; vòng ${palace.lifecycle}.`,
    ),
  };
}

function narrativeProfile(
  chart: TuViChart,
  traits: ReadingTrait[],
  ledger: NarrativeLedger,
  themeKey: CompatibilityThemeKey,
): NarrativeProfile {
  const personKey = `${chart.input.fullName}:${chart.canChi.year}`;
  const usedTraits = ledger.profileTraitsByPerson.get(personKey) || new Set<ReadingTrait>();
  const freshTrait = traits.find((trait) => {
    const themeUsingTrait = ledger.profileTraitTheme.get(trait);
    return !usedTraits.has(trait) && (!themeUsingTrait || themeUsingTrait === themeKey);
  });
  const leadTrait = freshTrait || traits[0];
  if (freshTrait) {
    usedTraits.add(freshTrait);
    if (!ledger.profileTraitTheme.has(freshTrait)) ledger.profileTraitTheme.set(freshTrait, themeKey);
  }
  ledger.profileTraitsByPerson.set(personKey, usedTraits);
  const orderedTraits = leadTrait ? [leadTrait, ...traits.filter((trait) => trait !== leadTrait)] : traits;
  const detail = freshTrait
    ? TRAIT_NARRATIVE_DETAILS[freshTrait]
    : traits.length
      ? THEME_FALLBACK_DETAILS[themeKey]
      : DEFAULT_NARRATIVE_DETAIL;
  return {
    name: chart.input.fullName,
    traits: orderedTraits,
    ...detail,
  };
}

function narrativeSeed(chart: TuViChart, config: ThemeConfig, traits: ReadingTrait[]) {
  const palaceSignals = config.palaces.map((name) => {
    const palace = palaceByName(chart, name);
    return palace ? `${name}:${palace.branch}:${palace.mainStars.join(",")}:${palace.supportStars.slice(0, 4).join(",")}` : name;
  });
  return [chart.canChi.year, ...traits, ...palaceSignals].join("|");
}

function themeReport(
  first: TuViChart,
  second: TuViChart,
  config: ThemeConfig,
  elementScore: number,
  ledger: NarrativeLedger,
): ChartCompatibilityTheme {
  const firstTraits = traitsForPalaces(first, config.palaces);
  const secondTraits = traitsForPalaces(second, config.palaces);
  const sharedTraits = firstTraits.filter((trait) => secondTraits.includes(trait));
  const complement = hasComplement(firstTraits, secondTraits);
  const elementWeight = ["temperament", "commitment", "family"].includes(config.key) ? elementScore : 0;
  const score = Math.min(4, sharedTraits.length * 2) + (complement ? 1 : 0) + elementWeight + signalBalance(first, config.palaces) + signalBalance(second, config.palaces);
  const level = compatibilityLevel(score);
  const interaction: InteractionKind = sharedTraits.length ? "shared" : complement ? "complementary" : "contrast";
  const narrative = buildThemeNarrative({
    key: config.key,
    level,
    interaction,
    seed: `${narrativeSeed(first, config, firstTraits)}::${narrativeSeed(second, config, secondTraits)}`,
    first: narrativeProfile(first, firstTraits, ledger, config.key),
    second: narrativeProfile(second, secondTraits, ledger, config.key),
  }, ledger);

  return {
    key: config.key,
    title: config.title,
    level,
    levelLabel: LEVEL_LABELS[level],
    summary: narrative.summary,
    whyItMatters: narrative.whyItMatters,
    possibleExpression: narrative.possibleExpression,
    actions: narrative.actions,
    questions: narrative.questions,
    evidence: [evidenceFor(first, config), evidenceFor(second, config)],
  };
}

function personSummary(chart: TuViChart) {
  return {
    name: chart.input.fullName,
    canChiYear: chart.canChi.year,
    banMenh: chart.banMenh,
    menh: chart.menh,
    than: chart.than,
    cuc: chart.cuc,
  };
}

export function buildChartCompatibilityReport(firstInput: ChartInput, secondInput: ChartInput): ChartCompatibilityReport {
  validateInput(firstInput);
  validateInput(secondInput);
  const first = generateTuViChart({ ...firstInput, fullName: firstInput.fullName.trim(), timezone: firstInput.timezone || "Asia/Bangkok" });
  const second = generateTuViChart({ ...secondInput, fullName: secondInput.fullName.trim(), timezone: secondInput.timezone || "Asia/Bangkok" });
  const elements = elementRelation(first, second);
  const ledger = new NarrativeLedger();
  const themes = THEME_CONFIGS.map((config) => themeReport(first, second, config, elements.score, ledger));
  const flowCount = themes.filter((theme) => theme.level === "flow").length;
  const discussCount = themes.filter((theme) => theme.level === "discuss").length;
  const overviewLevel: CompatibilityLevel = flowCount >= 4 && discussCount === 0 ? "flow" : discussCount >= 3 ? "discuss" : "coordinate";
  const strengths = themes.filter((theme) => theme.level === "flow").map((theme) => theme.title);
  const attention = themes.filter((theme) => theme.level !== "flow").map((theme) => theme.title);

  return {
    people: [personSummary(first), personSummary(second)],
    overview: {
      level: overviewLevel,
      levelLabel: LEVEL_LABELS[overviewLevel],
      title: `Bức tranh tương hợp của ${first.input.fullName} và ${second.input.fullName}`,
      summary: `Hai lá số có ${flowCount} chủ đề thuận để phát huy và ${attention.length} chủ đề cần chủ động phối hợp hoặc trao đổi rõ. Kết quả nên được dùng như bản đồ câu hỏi: giữ lại phần phản ánh đúng trải nghiệm, kiểm chứng bằng hành vi thực tế và ưu tiên sự tôn trọng, an toàn cùng trách nhiệm của cả hai.`,
      strengths: strengths.length ? strengths : ["Khả năng bổ sung khi hai người thống nhất vai trò và cách trao đổi"],
      attention: attention.length ? attention : ["Duy trì trao đổi định kỳ để điểm thuận không trở thành điều mặc định"],
    },
    elementReading: elements.text,
    themes,
    sharedQuestions: [
      "Điểm nào trong báo cáo đã xuất hiện lặp lại trong đời sống thật của hai người?",
      "Một thay đổi nhỏ nào cả hai có thể thử trong bảy ngày tới và cùng đánh giá lại?",
      "Chủ đề nào cần thêm dữ kiện thực tế, tư vấn chuyên môn hoặc một cuộc trao đổi an toàn hơn?",
    ],
    methodology: "Báo cáo đối chiếu Mệnh–Thân–Cục, ngũ hành bản mệnh và các cụm cung Mệnh, Phúc Đức, Phu Thê, Tài Bạch, Quan Lộc, Thiên Di, Nô Bộc, Điền Trạch, Phụ Mẫu, Tử Tức. Sao được lấy trực tiếp từ engine lá số; công cụ chỉ diễn giải tổ hợp, không tự an lại sao.",
    disclaimer: "Tử vi là hệ thống tham khảo để gợi mở cách quan sát. Báo cáo này không quyết định một mối quan hệ có nên tiếp tục, kết hôn, hợp tác hay chia tay; giờ sinh chưa chính xác có thể làm cấu trúc cung sao thay đổi. Khi có bạo lực, kiểm soát, tài chính rủi ro hoặc vấn đề sức khỏe tinh thần, hãy ưu tiên an toàn và sự hỗ trợ chuyên môn phù hợp.",
  };
}
