import { solarToLunar } from "@/lib/lunar";

export type Gender = "male" | "female";
export type Element = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
export type CriterionStatus = "favorable" | "neutral" | "caution";
export type CriterionRole = "primary" | "supporting";

export type Criterion = {
  key: string;
  label: string;
  status: CriterionStatus;
  role: CriterionRole;
  explanation: string;
};

export type LunarYearProfile = {
  lunarYear: number;
  canChi: string;
  stem: string;
  branch: string;
  polarity: "Dương" | "Âm";
  stemElement: Element;
  branchElement: Element;
  napAm: string;
  napAmElement: Element;
  cungPhi?: {
    number: number;
    name: string;
    group: "Đông tứ mệnh" | "Tây tứ mệnh";
  };
};

export type AnalysisBand = "favorable" | "mixed" | "caution";

export type AnalysisInterpretation = {
  headline: string;
  plainLanguage: string;
  strengths: string[];
  cautions: string[];
  nextSteps: string[];
  guardrail: string;
};

export type AnalysisSummary = {
  band: AnalysisBand;
  label: string;
  criteria: Criterion[];
  counts: { favorable: number; neutral: number; caution: number };
  interpretation: AnalysisInterpretation;
};

export type RankedYearResult<TDetails = Record<string, unknown>> = {
  year: number;
  profile: LunarYearProfile;
  summary: AnalysisSummary;
  details: TDetails;
};

export type AgeToolAnalysis<TDetails = Record<string, unknown>> = {
  title: string;
  profiles: { label: string; profile: LunarYearProfile }[];
  summary?: AnalysisSummary;
  years?: RankedYearResult<TDetails>[];
};

const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
const STEM_ELEMENTS = ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"] as const satisfies readonly Element[];
const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
const BRANCH_ELEMENTS = ["Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"] as const satisfies readonly Element[];

const NAP_AM = [
  ["Hải Trung Kim", "Kim"], ["Lư Trung Hỏa", "Hỏa"], ["Đại Lâm Mộc", "Mộc"],
  ["Lộ Bàng Thổ", "Thổ"], ["Kiếm Phong Kim", "Kim"], ["Sơn Đầu Hỏa", "Hỏa"],
  ["Giản Hạ Thủy", "Thủy"], ["Thành Đầu Thổ", "Thổ"], ["Bạch Lạp Kim", "Kim"],
  ["Dương Liễu Mộc", "Mộc"], ["Tuyền Trung Thủy", "Thủy"], ["Ốc Thượng Thổ", "Thổ"],
  ["Tích Lịch Hỏa", "Hỏa"], ["Tùng Bách Mộc", "Mộc"], ["Trường Lưu Thủy", "Thủy"],
  ["Sa Trung Kim", "Kim"], ["Sơn Hạ Hỏa", "Hỏa"], ["Bình Địa Mộc", "Mộc"],
  ["Bích Thượng Thổ", "Thổ"], ["Kim Bạch Kim", "Kim"], ["Phúc Đăng Hỏa", "Hỏa"],
  ["Thiên Hà Thủy", "Thủy"], ["Đại Trạch Thổ", "Thổ"], ["Thoa Xuyến Kim", "Kim"],
  ["Tang Đố Mộc", "Mộc"], ["Đại Khê Thủy", "Thủy"], ["Sa Trung Thổ", "Thổ"],
  ["Thiên Thượng Hỏa", "Hỏa"], ["Thạch Lựu Mộc", "Mộc"], ["Đại Hải Thủy", "Thủy"],
] as const satisfies readonly (readonly [string, Element])[];

const CUNG_PHI = {
  1: { name: "Khảm", group: "Đông tứ mệnh" },
  2: { name: "Khôn", group: "Tây tứ mệnh" },
  3: { name: "Chấn", group: "Đông tứ mệnh" },
  4: { name: "Tốn", group: "Đông tứ mệnh" },
  6: { name: "Càn", group: "Tây tứ mệnh" },
  7: { name: "Đoài", group: "Tây tứ mệnh" },
  8: { name: "Cấn", group: "Tây tứ mệnh" },
  9: { name: "Ly", group: "Đông tứ mệnh" },
} as const;

const BRANCH_TRIADS = [[8, 0, 4], [2, 6, 10], [11, 3, 7], [5, 9, 1]] as const;
const BRANCH_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]] as const;
const BRANCH_CLASH = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]] as const;
const BRANCH_HARM = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]] as const;
const BRANCH_BREAK = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]] as const;
const STEM_HARMONY = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]] as const;

const ELEMENT_GENERATES: Record<Element, Element> = {
  Mộc: "Hỏa",
  Hỏa: "Thổ",
  Thổ: "Kim",
  Kim: "Thủy",
  Thủy: "Mộc",
};

const ELEMENT_CONTROLS: Record<Element, Element> = {
  Mộc: "Thổ",
  Thổ: "Thủy",
  Thủy: "Hỏa",
  Hỏa: "Kim",
  Kim: "Mộc",
};

const TRIGRAM_BINARY: Record<string, number> = {
  Khôn: 0b000,
  Chấn: 0b100,
  Tốn: 0b011,
  Khảm: 0b010,
  Ly: 0b101,
  Cấn: 0b001,
  Đoài: 0b110,
  Càn: 0b111,
};

const DU_NIEN_BY_XOR = {
  0b000: ["Phục Vị", "favorable"],
  0b001: ["Sinh Khí", "favorable"],
  0b110: ["Thiên Y", "favorable"],
  0b111: ["Diên Niên", "favorable"],
  0b100: ["Họa Hại", "caution"],
  0b011: ["Ngũ Quỷ", "caution"],
  0b101: ["Lục Sát", "caution"],
  0b010: ["Tuyệt Mệnh", "caution"],
} as const satisfies Record<number, readonly [string, CriterionStatus]>;

const HOANG_OC = [
  ["Nhất Cát", "favorable"],
  ["Nhì Nghi", "favorable"],
  ["Tam Địa Sát", "caution"],
  ["Tứ Tấn Tài", "favorable"],
  ["Ngũ Thọ Tử", "caution"],
  ["Lục Hoang Ốc", "caution"],
] as const satisfies readonly (readonly [string, CriterionStatus])[];

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function reduceDigit(value: number): number {
  let result = Math.abs(value);
  while (result > 9) {
    result = String(result).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return result;
}

function getCungPhi(lunarYear: number, gender: Gender) {
  const lastTwoDigits = mod(lunarYear, 100);
  const digit = reduceDigit(Math.floor(lastTwoDigits / 10) + mod(lastTwoDigits, 10));
  let number = lunarYear < 2000
    ? gender === "male" ? 10 - digit : reduceDigit(digit + 5)
    : gender === "male" ? 9 - digit : reduceDigit(digit + 6);

  if (number === 0) number = 9;
  if (number === 5) number = gender === "male" ? 2 : 8;

  const cung = CUNG_PHI[number as keyof typeof CUNG_PHI];
  if (!cung) throw new Error(`Không xác định được Cung Phi cho năm ${lunarYear}.`);
  return { number, ...cung };
}

export function profileFromLunarYear(lunarYear: number, gender?: Gender): LunarYearProfile {
  if (!Number.isInteger(lunarYear) || lunarYear < 1) {
    throw new Error("Năm âm lịch không hợp lệ.");
  }

  const cycleIndex = mod(lunarYear - 4, 60);
  const stemIndex = cycleIndex % STEMS.length;
  const branchIndex = cycleIndex % BRANCHES.length;
  const [napAm, napAmElement] = NAP_AM[Math.floor(cycleIndex / 2)];

  return {
    lunarYear,
    canChi: `${STEMS[stemIndex]} ${BRANCHES[branchIndex]}`,
    stem: STEMS[stemIndex],
    branch: BRANCHES[branchIndex],
    polarity: cycleIndex % 2 === 0 ? "Dương" : "Âm",
    stemElement: STEM_ELEMENTS[stemIndex],
    branchElement: BRANCH_ELEMENTS[branchIndex],
    napAm,
    napAmElement,
    cungPhi: gender ? getCungPhi(lunarYear, gender) : undefined,
  };
}

export function profileFromSolarDate(date: string, gender?: Gender): LunarYearProfile {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error("Ngày sinh phải theo định dạng YYYY-MM-DD.");

  const [, year, month, day] = match.map(Number);
  const lunar = solarToLunar(day, month, year, 7);
  return profileFromLunarYear(lunar.year, gender);
}

function includesPair(groups: readonly (readonly number[])[], left: number, right: number) {
  return groups.some((group) => group.includes(left) && group.includes(right));
}

function elementRelation(left: Element, right: Element) {
  if (left === right) {
    return { status: "neutral" as const, explanation: `${left} và ${right} đồng hành.` };
  }
  if (ELEMENT_GENERATES[left] === right) {
    return { status: "favorable" as const, explanation: `${left} sinh ${right}.` };
  }
  if (ELEMENT_GENERATES[right] === left) {
    return { status: "favorable" as const, explanation: `${right} sinh ${left}.` };
  }
  if (ELEMENT_CONTROLS[left] === right) {
    return { status: "caution" as const, explanation: `${left} khắc ${right}.` };
  }
  return { status: "caution" as const, explanation: `${right} khắc ${left}.` };
}

function branchCriterion(left: LunarYearProfile, right: LunarYearProfile): Criterion {
  const leftIndex = BRANCHES.indexOf(left.branch as (typeof BRANCHES)[number]);
  const rightIndex = BRANCHES.indexOf(right.branch as (typeof BRANCHES)[number]);
  let status: CriterionStatus = "neutral";
  let relation = "không thuộc nhóm hợp hoặc xung chính";

  if (leftIndex === rightIndex) {
    relation = `đồng chi ${left.branch}`;
  } else if (includesPair(BRANCH_HARMONY, leftIndex, rightIndex)) {
    status = "favorable";
    relation = "lục hợp";
  } else if (includesPair(BRANCH_TRIADS, leftIndex, rightIndex)) {
    status = "favorable";
    relation = "tam hợp";
  } else if (includesPair(BRANCH_CLASH, leftIndex, rightIndex)) {
    status = "caution";
    relation = "lục xung";
  } else if (includesPair(BRANCH_HARM, leftIndex, rightIndex)) {
    status = "caution";
    relation = "tương hại";
  } else if (includesPair(BRANCH_BREAK, leftIndex, rightIndex)) {
    status = "caution";
    relation = "tương phá";
  }

  return {
    key: "dia-chi",
    label: "Địa Chi",
    status,
    role: "primary",
    explanation: `${left.branch} và ${right.branch}: ${relation}.`,
  };
}

function stemCriterion(left: LunarYearProfile, right: LunarYearProfile): Criterion {
  const leftIndex = STEMS.indexOf(left.stem as (typeof STEMS)[number]);
  const rightIndex = STEMS.indexOf(right.stem as (typeof STEMS)[number]);
  const relation = elementRelation(left.stemElement, right.stemElement);
  const harmonious = leftIndex !== rightIndex && includesPair(STEM_HARMONY, leftIndex, rightIndex);

  return {
    key: "thien-can",
    label: "Thiên Can",
    status: harmonious ? "favorable" : relation.status,
    role: "primary",
    explanation: harmonious
      ? `${left.stem} và ${right.stem} thuộc cặp thiên can tương hợp.`
      : `${left.stem} (${left.stemElement}) với ${right.stem} (${right.stemElement}): ${relation.explanation}`,
  };
}

function napAmCriterion(left: LunarYearProfile, right: LunarYearProfile): Criterion {
  const relation = elementRelation(left.napAmElement, right.napAmElement);
  return {
    key: "nap-am",
    label: "Nạp âm",
    status: relation.status,
    role: "primary",
    explanation: `${left.napAm} (${left.napAmElement}) với ${right.napAm} (${right.napAmElement}): ${relation.explanation}`,
  };
}

function cungPhiCriterion(left: LunarYearProfile, right: LunarYearProfile): Criterion | undefined {
  if (!left.cungPhi || !right.cungPhi) return undefined;
  const xor = (TRIGRAM_BINARY[left.cungPhi.name] ^ TRIGRAM_BINARY[right.cungPhi.name]) as keyof typeof DU_NIEN_BY_XOR;
  const relation = DU_NIEN_BY_XOR[xor];
  return {
    key: "cung-phi",
    label: "Cung Phi",
    status: relation[1],
    role: "supporting",
    explanation: `${left.cungPhi.name} và ${right.cungPhi.name} tạo cung ${relation[0]} theo Du Niên; đây là lớp tham khảo bổ trợ.`,
  };
}

type InterpretationContext = {
  tool?: "vo-chong" | "lam-an" | "xong-dat" | "sinh-con" | "ket-hon" | "lam-nha";
  year?: number;
};

const TOOL_CONTEXT: Record<NonNullable<InterpretationContext["tool"]>, {
  subject: string;
  relation: string;
  favorableFocus: string;
  cautionFocus: string;
  nextSteps: string[];
  guardrail: string;
}> = {
  "vo-chong": {
    subject: "mối quan hệ vợ chồng",
    relation: "nhịp sống, cách giao tiếp và trách nhiệm giữa hai người",
    favorableFocus: "các lớp tuổi đang tạo nền dễ đồng cảm hơn khi bàn chuyện gia đình, tiền bạc và kế hoạch dài hạn",
    cautionFocus: "một số lớp tuổi có thể tạo cảm giác lệch nhịp, nên cần nói rõ kỳ vọng và cách xử lý mâu thuẫn",
    nextSteps: [
      "Đọc lại từng tiêu chí cùng nhau, tách phần thuận và phần cần rèn trong giao tiếp hằng ngày.",
      "Nếu đang tính chuyện cưới hỏi, xem thêm năm cưới và ngày cưới như lớp thời điểm, không thay cho sự đồng thuận của hai người.",
    ],
    guardrail: "Kết quả chỉ là tham khảo theo Can Chi và Cung Phi; chất lượng hôn nhân còn phụ thuộc vào sự tự nguyện, trách nhiệm và cách hai người sống với nhau.",
  },
  "lam-an": {
    subject: "việc hợp tác làm ăn",
    relation: "cách phối hợp, mức độ tin cậy và nhịp ra quyết định trong công việc",
    favorableFocus: "các tín hiệu thuận có thể hỗ trợ sự ăn ý khi chia vai trò, bàn kế hoạch và giữ nhịp hợp tác",
    cautionFocus: "các tín hiệu xung khắc nên được chuyển thành checklist về hợp đồng, quyền hạn và cơ chế xử lý tranh chấp",
    nextSteps: [
      "Xác định rõ người phụ trách tiền, vận hành, pháp lý và kênh ra quyết định trước khi bắt đầu.",
      "Kiểm tra năng lực, dòng tiền và điều khoản hợp đồng; không dùng kết quả tuổi để thay thế thẩm định thực tế.",
    ],
    guardrail: "Kết quả chỉ là tham khảo văn hóa; công cụ không dự báo doanh thu, lợi nhuận hay rủi ro thị trường.",
  },
  "xong-dat": {
    subject: "việc chọn người xông đất",
    relation: "khí đầu năm, sự hòa hợp với gia chủ và tương quan với năm mới",
    favorableFocus: "những tuổi được xếp cao thường có ít cảnh báo chính và tạo cảm giác thuận hòa hơn khi mở đầu năm",
    cautionFocus: "tuổi hợp vẫn cần xét sức khỏe, tâm trạng, quan hệ với gia đình và hoàn cảnh đến nhà đầu năm",
    nextSteps: [
      "Ưu tiên người vui vẻ, khỏe mạnh, có quan hệ tốt với gia đình và đến nhà trong khung giờ phù hợp phong tục.",
      "Nếu nhiều tuổi cùng thuận, chọn người có hoàn cảnh thực tế hài hòa hơn thay vì chỉ nhìn thứ hạng.",
    ],
    guardrail: "Kết quả chỉ là tham khảo phong tục đầu năm; không nên dùng để kỳ vọng tài lộc hoặc vận hạn của cả năm.",
  },
  "sinh-con": {
    subject: "kế hoạch sinh con",
    relation: "sự hài hòa tuổi con với cả cha và mẹ",
    favorableFocus: "năm được gợi ý thường giữ được nhiều tín hiệu thuận với cả hai phía, giúp gia đình dễ đọc bối cảnh hơn",
    cautionFocus: "năm có cảnh báo với một phía nên được hiểu là điểm cần chuẩn bị thêm về nhịp sống và sự hỗ trợ trong gia đình",
    nextSteps: [
      "Đặt sức khỏe, tuổi sinh sản, điều kiện chăm sóc và tư vấn chuyên môn lên trước yếu tố hợp tuổi.",
      "Nếu đang so nhiều năm, chọn khoảng thời gian thực tế với gia đình rồi dùng kết quả tuổi như lớp đối chiếu bổ sung.",
    ],
    guardrail: "Kết quả chỉ là tham khảo theo tuổi truyền thống; không phải lời khuyên y khoa hoặc chỉ dẫn sinh sản.",
  },
  "ket-hon": {
    subject: "việc chọn năm kết hôn",
    relation: "tuổi mụ, Kim Lâu, Tam Tai và quan hệ với năm dự kiến",
    favorableFocus: "năm ít cảnh báo giúp hai gia đình dễ yên tâm hơn khi bàn lịch cưới và các nghi thức liên quan",
    cautionFocus: "năm có cảnh báo không nên bị hiểu là phải dừng việc cưới, mà là tín hiệu để chuẩn bị kỹ hơn",
    nextSteps: [
      "Đối chiếu năm cưới với pháp lý, sức khỏe, tài chính, lịch hai gia đình và mức độ sẵn sàng của hai người.",
      "Sau khi chọn được khoảng năm phù hợp, xem tiếp ngày cưới hỏi thay vì chỉ chốt bằng năm.",
    ],
    guardrail: "Kết quả chỉ là tham khảo theo quan niệm dân gian; quyết định kết hôn cần dựa trên sự đồng thuận và trách nhiệm thực tế.",
  },
  "lam-nha": {
    subject: "kế hoạch làm nhà",
    relation: "Tam Tai, Kim Lâu, Hoang Ốc và tuổi mụ của gia chủ",
    favorableFocus: "năm ít cảnh báo giúp gia chủ dễ yên tâm hơn khi chuẩn bị động thổ, sửa chữa hoặc xây dựng",
    cautionFocus: "năm có cảnh báo nên được xem như lời nhắc kiểm tra kỹ pháp lý, ngân sách, tiến độ và an toàn thi công",
    nextSteps: [
      "Hoàn tất pháp lý đất, thiết kế, dự toán, nhà thầu và phương án an toàn trước khi chốt thời điểm.",
      "Nếu vẫn muốn làm trong năm có cảnh báo, hãy bàn rõ với gia đình và người tư vấn phong tục địa phương.",
    ],
    guardrail: "Kết quả chỉ là tham khảo phong tục; công cụ không đề xuất mua vật phẩm, cúng giải hay thay thế quyết định kỹ thuật.",
  },
};

function summarizeSignal(criteria: Criterion[], status: CriterionStatus) {
  return criteria
    .filter((criterion) => criterion.status === status)
    .map((criterion) => criterion.label)
    .slice(0, 3);
}

function buildInterpretation(criteria: Criterion[], band: AnalysisBand, label: string, context: InterpretationContext = {}): AnalysisInterpretation {
  const tool = context.tool ? TOOL_CONTEXT[context.tool] : undefined;
  const subject = tool?.subject ?? "kết quả xem tuổi";
  const relation = tool?.relation ?? "các lớp Can Chi, Nạp âm và Địa Chi";
  const favorableSignals = summarizeSignal(criteria, "favorable");
  const cautionSignals = summarizeSignal(criteria, "caution");
  const neutralSignals = summarizeSignal(criteria, "neutral");
  const target = context.year ? `Năm ${context.year}` : "Kết quả này";
  const headline = `${target}: ${label.toLowerCase()} cho ${subject}`;

  const plainLanguage = band === "favorable"
    ? `${target} đang có nhiều tín hiệu thuận khi đối chiếu ${relation}. Nên hiểu đây là nền tham khảo khá dễ dùng: các điểm thuận giúp người xem yên tâm hơn, nhưng vẫn cần đặt vào hoàn cảnh gia đình, công việc và điều kiện thực tế.`
    : band === "caution"
      ? `${target} có nhiều điểm cần cân nhắc khi đối chiếu ${relation}. Điều quan trọng là không đọc kết quả như một lời cấm đoán, mà xem đây là danh sách những phần nên kiểm tra kỹ hơn trước khi quyết định.`
      : `${target} có cả tín hiệu thuận và tín hiệu cần cân nhắc khi đối chiếu ${relation}. Cách đọc phù hợp là giữ lại điểm hỗ trợ, đồng thời biến điểm xung khắc thành việc cần chuẩn bị rõ ràng hơn trong đời sống thực tế.`;

  const strengths = favorableSignals.length
    ? [
      `Điểm thuận nổi bật nằm ở ${favorableSignals.join(", ")}, cho thấy ${tool?.favorableFocus ?? "có vài lớp hỗ trợ để người xem tham khảo thêm"}.`,
      neutralSignals.length ? `Các tiêu chí trung tính như ${neutralSignals.join(", ")} không tạo cảnh báo lớn, nhưng cũng không nên dùng làm căn cứ duy nhất.` : "Khi nhiều tiêu chí cùng thuận, người xem vẫn nên đọc từng lý do thay vì chỉ nhìn nhãn tổng quan.",
    ]
    : [
      "Kết quả không có nhiều điểm thuận rõ rệt, vì vậy giá trị chính nằm ở việc chỉ ra phần nào cần chuẩn bị kỹ hơn.",
    ];

  const cautions = cautionSignals.length
    ? [
      `Điểm cần cân nhắc nằm ở ${cautionSignals.join(", ")}; ${tool?.cautionFocus ?? "nên xem đây là tín hiệu để kiểm tra lại bối cảnh thực tế"}.`,
      "Một tiêu chí xung khắc không đủ để phủ định toàn bộ việc đang xem; hãy đọc nó cùng các tiêu chí còn lại.",
    ]
    : [
      "Không có cảnh báo chính nổi bật, nhưng kết quả vẫn chỉ phản ánh phần tuổi, chưa bao gồm sức khỏe, pháp lý, tài chính, tính cách và hoàn cảnh từng người.",
    ];

  return {
    headline,
    plainLanguage,
    strengths,
    cautions,
    nextSteps: tool?.nextSteps ?? [
      "Đọc từng tiêu chí trước khi đưa ra quyết định.",
      "Đối chiếu kết quả với hoàn cảnh thực tế và các điều kiện quan trọng khác.",
    ],
    guardrail: tool?.guardrail ?? "Kết quả chỉ là tham khảo theo tuổi truyền thống và không thay thế quyết định thực tế.",
  };
}

function summarize(criteria: Criterion[], context?: InterpretationContext): AnalysisSummary {
  const counts = criteria.reduce(
    (result, criterion) => ({ ...result, [criterion.status]: result[criterion.status] + 1 }),
    { favorable: 0, neutral: 0, caution: 0 },
  );
  const primaryCautions = criteria.filter((item) => item.role === "primary" && item.status === "caution").length;
  const band: AnalysisBand = primaryCautions === 0 && counts.favorable > counts.neutral
    ? "favorable"
    : primaryCautions >= 2
      ? "caution"
      : "mixed";
  const label = band === "favorable"
    ? "Nhiều điểm thuận"
    : band === "caution"
      ? "Nên cân nhắc kỹ"
      : "Có thuận lợi và điểm cần cân nhắc";
  return { band, label, criteria, counts, interpretation: buildInterpretation(criteria, band, label, context) };
}

export function comparePeople(
  left: LunarYearProfile,
  right: LunarYearProfile,
  includeCungPhi = false,
  context?: InterpretationContext,
): AnalysisSummary {
  const criteria = [napAmCriterion(left, right), stemCriterion(left, right), branchCriterion(left, right)];
  const cungPhi = includeCungPhi ? cungPhiCriterion(left, right) : undefined;
  if (cungPhi) criteria.push(cungPhi);
  return summarize(criteria, context);
}

function validateYearRange(startYear: number, endYear: number) {
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear > endYear || endYear - startYear > 20) {
    throw new Error("Khoảng năm phải hợp lệ và không dài quá 20 năm.");
  }
}

function rankYears<T>(years: RankedYearResult<T>[]) {
  return years.sort((left, right) => {
    const leftPrimaryCautions = left.summary.criteria.filter((item) => item.role === "primary" && item.status === "caution").length;
    const rightPrimaryCautions = right.summary.criteria.filter((item) => item.role === "primary" && item.status === "caution").length;
    if (leftPrimaryCautions !== rightPrimaryCautions) return leftPrimaryCautions - rightPrimaryCautions;
    const leftPrimaryFavorable = left.summary.criteria.filter((item) => item.role === "primary" && item.status === "favorable").length;
    const rightPrimaryFavorable = right.summary.criteria.filter((item) => item.role === "primary" && item.status === "favorable").length;
    return rightPrimaryFavorable - leftPrimaryFavorable || left.year - right.year;
  });
}

function mergeComparison(summary: AnalysisSummary, prefix: string, label: string, role?: CriterionRole) {
  return summary.criteria
    .filter((criterion) => criterion.key !== "cung-phi")
    .map((criterion) => ({
      ...criterion,
      key: `${prefix}-${criterion.key}`,
      label: `${label}: ${criterion.label}`,
      role: role ?? criterion.role,
    }));
}

function getAgeMu(birthLunarYear: number, targetYear: number) {
  return targetYear - birthLunarYear + 1;
}

function getKimLau(ageMu: number) {
  const remainder = mod(ageMu, 9);
  const names: Partial<Record<number, string>> = {
    1: "Kim Lâu Thân",
    3: "Kim Lâu Thê",
    6: "Kim Lâu Tử",
    8: "Kim Lâu Súc",
  };
  return { active: Boolean(names[remainder]), remainder, name: names[remainder] ?? "Không phạm Kim Lâu" };
}

function getHoangOc(ageMu: number) {
  const position = mod(Math.floor(ageMu / 10) - 1 + mod(ageMu, 10), 6);
  const [name, status] = HOANG_OC[position];
  return { position, name, status };
}

function getTamTai(birthBranch: string, targetBranch: string) {
  const birth = BRANCHES.indexOf(birthBranch as (typeof BRANCHES)[number]);
  const target = BRANCHES.indexOf(targetBranch as (typeof BRANCHES)[number]);
  const badYears = includesPair([BRANCH_TRIADS[0]], birth, birth)
    ? [2, 3, 4]
    : includesPair([BRANCH_TRIADS[1]], birth, birth)
      ? [8, 9, 10]
      : includesPair([BRANCH_TRIADS[2]], birth, birth)
        ? [5, 6, 7]
        : [11, 0, 1];
  return { active: badYears.includes(target), years: badYears.map((index) => BRANCHES[index]) };
}

function targetYears(startYear: number, endYear: number) {
  validateYearRange(startYear, endYear);
  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

export function analyzeVoChong(leftDate: string, leftGender: Gender, rightDate: string, rightGender: Gender) {
  const left = profileFromSolarDate(leftDate, leftGender);
  const right = profileFromSolarDate(rightDate, rightGender);
  return {
    title: "Đối chiếu tuổi vợ chồng",
    profiles: [{ label: "Người thứ nhất", profile: left }, { label: "Người thứ hai", profile: right }],
    summary: comparePeople(left, right, true, { tool: "vo-chong" }),
  } satisfies AgeToolAnalysis;
}

export function analyzeLamAn(leftDate: string, rightDate: string) {
  const left = profileFromSolarDate(leftDate);
  const right = profileFromSolarDate(rightDate);
  return {
    title: "Đối chiếu tuổi làm ăn",
    profiles: [{ label: "Người thứ nhất", profile: left }, { label: "Người thứ hai", profile: right }],
    summary: comparePeople(left, right, false, { tool: "lam-an" }),
  } satisfies AgeToolAnalysis;
}

export function analyzeXongDat(ownerDate: string, targetYear: number) {
  const owner = profileFromSolarDate(ownerDate);
  const yearProfile = profileFromLunarYear(targetYear);
  const years = Array.from({ length: 63 }, (_, index) => targetYear - 80 + index).map((candidateYear) => {
    const profile = profileFromLunarYear(candidateYear);
    const criteria = [
      ...mergeComparison(comparePeople(profile, owner), "gia-chu", "Với gia chủ"),
      ...mergeComparison(comparePeople(profile, yearProfile), "nam", `Với năm ${targetYear}`, "supporting"),
    ];
    return { year: candidateYear, profile, summary: summarize(criteria, { tool: "xong-dat", year: candidateYear }), details: {} };
  });
  return {
    title: `Gợi ý tuổi xông đất năm ${targetYear}`,
    profiles: [{ label: "Gia chủ", profile: owner }, { label: `Năm ${targetYear}`, profile: yearProfile }],
    years: rankYears(years).slice(0, 10),
  } satisfies AgeToolAnalysis;
}

export function analyzeSinhCon(fatherDate: string, motherDate: string, startYear: number, endYear: number) {
  const father = profileFromSolarDate(fatherDate);
  const mother = profileFromSolarDate(motherDate);
  const years = targetYears(startYear, endYear).map((year) => {
    const profile = profileFromLunarYear(year);
    const criteria = [
      ...mergeComparison(comparePeople(profile, father), "cha", "Với cha"),
      ...mergeComparison(comparePeople(profile, mother), "me", "Với mẹ"),
    ];
    return { year, profile, summary: summarize(criteria, { tool: "sinh-con", year }), details: {} };
  });
  return {
    title: "Gợi ý năm sinh con",
    profiles: [{ label: "Cha", profile: father }, { label: "Mẹ", profile: mother }],
    years: rankYears(years).slice(0, 5),
  } satisfies AgeToolAnalysis;
}

type WeddingYearDetails = {
  ageMu: number;
  kimLau: ReturnType<typeof getKimLau>;
  tamTai: ReturnType<typeof getTamTai>;
  thaiTue: { type: "direct" | "clash" | "none"; label: string };
};

export function analyzeKetHon(date: string, gender: Gender, startYear: number, endYear: number) {
  const person = profileFromSolarDate(date, gender);
  const years: RankedYearResult<WeddingYearDetails>[] = targetYears(startYear, endYear).map((year) => {
    const profile = profileFromLunarYear(year);
    const ageMu = getAgeMu(person.lunarYear, year);
    const kimLau = getKimLau(ageMu);
    const tamTai = getTamTai(person.branch, profile.branch);
    const branch = branchCriterion(person, profile);
    const thaiTue = person.branch === profile.branch
      ? { type: "direct" as const, label: "Trực Thái Tuế (đồng chi năm)" }
      : branch.explanation.includes("lục xung")
        ? { type: "clash" as const, label: "Xung Thái Tuế (lục xung với năm)" }
        : { type: "none" as const, label: "Không trực hoặc xung Thái Tuế" };
    const criteria: Criterion[] = [
      { key: "kim-lau", label: "Kim Lâu", status: kimLau.active ? "caution" : "favorable", role: "primary", explanation: `Tuổi mụ ${ageMu}, chia 9 dư ${kimLau.remainder}: ${kimLau.name}.` },
      { key: "tam-tai", label: "Tam Tai", status: tamTai.active ? "caution" : "favorable", role: "primary", explanation: tamTai.active ? `Năm ${profile.branch} thuộc nhóm Tam Tai ${tamTai.years.join("–")}.` : `Năm ${profile.branch} không thuộc nhóm Tam Tai ${tamTai.years.join("–")}.` },
      { key: "thai-tue", label: "Thái Tuế", status: thaiTue.type === "none" ? "neutral" : "caution", role: "supporting", explanation: thaiTue.label + "." },
    ];
    return { year, profile, summary: summarize(criteria, { tool: "ket-hon", year }), details: { ageMu, kimLau, tamTai, thaiTue } };
  });
  return {
    title: "Gợi ý năm kết hôn",
    profiles: [{ label: "Người xem", profile: person }],
    years: rankYears(years),
  };
}

type HomeYearDetails = {
  ageMu: number;
  kimLau: ReturnType<typeof getKimLau>;
  tamTai: ReturnType<typeof getTamTai>;
  hoangOc: ReturnType<typeof getHoangOc>;
};

export function analyzeLamNha(date: string, gender: Gender, startYear: number, endYear: number) {
  const person = profileFromSolarDate(date, gender);
  const years: RankedYearResult<HomeYearDetails>[] = targetYears(startYear, endYear).map((year) => {
    const profile = profileFromLunarYear(year);
    const ageMu = getAgeMu(person.lunarYear, year);
    const kimLau = getKimLau(ageMu);
    const tamTai = getTamTai(person.branch, profile.branch);
    const hoangOc = getHoangOc(ageMu);
    const criteria: Criterion[] = [
      { key: "tam-tai", label: "Tam Tai", status: tamTai.active ? "caution" : "favorable", role: "primary", explanation: tamTai.active ? `Năm ${profile.branch} thuộc nhóm Tam Tai ${tamTai.years.join("–")}.` : `Năm ${profile.branch} không thuộc nhóm Tam Tai ${tamTai.years.join("–")}.` },
      { key: "kim-lau", label: "Kim Lâu", status: kimLau.active ? "caution" : "favorable", role: "primary", explanation: `Tuổi mụ ${ageMu}, chia 9 dư ${kimLau.remainder}: ${kimLau.name}.` },
      { key: "hoang-oc", label: "Hoang Ốc", status: hoangOc.status, role: "primary", explanation: `Tuổi mụ ${ageMu} vào cung ${hoangOc.name}.` },
    ];
    return { year, profile, summary: summarize(criteria, { tool: "lam-nha", year }), details: { ageMu, kimLau, tamTai, hoangOc } };
  });
  return {
    title: "Gợi ý năm làm nhà",
    profiles: [{ label: "Gia chủ", profile: person }],
    years: rankYears(years),
  };
}
