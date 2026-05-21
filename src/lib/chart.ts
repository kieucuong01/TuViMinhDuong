import { jdFromDate, lunarToSolar, solarToLunar, type SolarDate } from "@/lib/lunar";

export const CHART_ENGINE_VERSION = "0.6.0";

export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";

export type ChartInput = {
  fullName: string;
  gender: Gender;
  calendarType: CalendarType;
  day: number;
  month: number;
  year: number;
  birthHour: number;
  birthMinute?: number;
  viewYear: number;
  timezone?: string;
};

export type Palace = {
  index: number;
  branch: string;
  name: string;
  ageRange: string;
  mainStars: string[];
  supportStars: string[];
  yearlyStars: string[];
  starStates: Record<string, StarBrightness>;
  lifecycle: string;
  isMenh: boolean;
  isThan: boolean;
};

export type StarBrightness = "M" | "V" | "Đ" | "B" | "H";

export type BoneWeight = {
  totalChi: number;
  label: string;
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
  };
};

export type TuViChart = {
  input: ChartInput;
  generatedAt: string;
  solar: SolarDate;
  lunar: { day: number; month: number; year: number; leap: boolean };
  canChi: { year: string; month: string; day: string; hour: string };
  menh: string;
  than: string;
  cuc: string;
  banMenh: string;
  cucElement: string;
  menhChu: string;
  thanChu: string;
  menhCucRelation: string;
  amDuong: string;
  boneWeight: BoneWeight;
  laiNhan: string;
  palaces: Palace[];
  daiVan: { palace: string; branch: string; range: string }[];
  summary: string[];
  engine: {
    version: string;
    calendar: string;
    starProfile: string;
    notes: string[];
  };
};

type CucElement = "K" | "M" | "T" | "H" | "O";

const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const BRANCH_INDEX = Object.fromEntries(BRANCHES.map((branch, index) => [branch, index])) as Record<string, number>;
const PALACE_NAMES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
];
const MAIN_STAR_NAMES = [
  "Tử Vi",
  "Liêm Trinh",
  "Thiên Đồng",
  "Vũ Khúc",
  "Thái Dương",
  "Thiên Cơ",
  "Thiên Phủ",
  "Thái Âm",
  "Tham Lang",
  "Cự Môn",
  "Thiên Tướng",
  "Thiên Lương",
  "Thất Sát",
  "Phá Quân",
];
const THAI_TUE_CYCLE = [
  ["Thái Tuế"],
  ["Thiếu Dương", "Thiên Không"],
  ["Tang Môn"],
  ["Thiếu Âm"],
  ["Quan Phù"],
  ["Tử Phù", "Nguyệt Đức"],
  ["Tuế Phá"],
  ["Long Đức"],
  ["Bạch Hổ"],
  ["Phúc Đức", "Thiên Đức"],
  ["Điếu Khách"],
  ["Trực Phù"],
];
const DOCTOR_CYCLE = [
  "Bác Sĩ",
  "Lực Sĩ",
  "Thanh Long",
  "Tiểu Hao",
  "Tướng Quân",
  "Tấu Thư",
  "Phi Liêm",
  "Hỷ Thần",
  "Bệnh Phù",
  "Đại Hao",
  "Phục Binh",
  "Quan Phủ",
];
const LIFECYCLE = ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
const CUCS: { label: string; number: number; element: CucElement }[] = [
  { label: "Thủy nhị cục", number: 2, element: "T" },
  { label: "Mộc tam cục", number: 3, element: "M" },
  { label: "Kim tứ cục", number: 4, element: "K" },
  { label: "Thổ ngũ cục", number: 5, element: "O" },
  { label: "Hỏa lục cục", number: 6, element: "H" },
];
const ELEMENT_NAMES: Record<CucElement, string> = {
  K: "Kim",
  M: "Mộc",
  T: "Thủy",
  H: "Hỏa",
  O: "Thổ",
};
const LOC_TON_BY_STEM = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
const FOUR_TRANSFORMS: Record<number, { loc: string; quyen: string; khoa: string; ky: string }> = {
  0: { loc: "Liêm Trinh", quyen: "Phá Quân", khoa: "Vũ Khúc", ky: "Thái Dương" },
  1: { loc: "Thiên Cơ", quyen: "Thiên Lương", khoa: "Tử Vi", ky: "Thái Âm" },
  2: { loc: "Thiên Đồng", quyen: "Thiên Cơ", khoa: "Văn Xương", ky: "Liêm Trinh" },
  3: { loc: "Thái Âm", quyen: "Thiên Đồng", khoa: "Thiên Cơ", ky: "Cự Môn" },
  4: { loc: "Tham Lang", quyen: "Thái Âm", khoa: "Hữu Bật", ky: "Thiên Cơ" },
  5: { loc: "Vũ Khúc", quyen: "Tham Lang", khoa: "Thiên Lương", ky: "Văn Khúc" },
  6: { loc: "Thái Dương", quyen: "Vũ Khúc", khoa: "Thiên Đồng", ky: "Thái Âm" },
  7: { loc: "Cự Môn", quyen: "Thái Dương", khoa: "Văn Khúc", ky: "Văn Xương" },
  8: { loc: "Thiên Lương", quyen: "Tử Vi", khoa: "Thiên Phủ", ky: "Vũ Khúc" },
  9: { loc: "Phá Quân", quyen: "Cự Môn", khoa: "Thái Âm", ky: "Tham Lang" },
};

function stateMap(groups: Partial<Record<StarBrightness, string[]>>) {
  const states: Partial<Record<number, StarBrightness>> = {};
  for (const [state, branches] of Object.entries(groups) as [StarBrightness, string[]][]) {
    for (const branch of branches) states[BRANCH_INDEX[branch]] = state;
  }
  return states;
}

const MAIN_STAR_STATES: Record<string, Partial<Record<number, StarBrightness>>> = {
  "Tử Vi": stateMap({
    M: ["Tỵ", "Ngọ"],
    V: ["Dần", "Thân", "Thìn", "Tuất"],
    "Đ": ["Sửu", "Mùi", "Hợi", "Tý"],
    B: ["Mão", "Dậu"],
  }),
  "Thiên Phủ": stateMap({
    M: ["Dần", "Thân"],
    V: ["Tý", "Ngọ", "Thìn", "Tuất"],
    "Đ": ["Mùi", "Hợi"],
    B: ["Sửu", "Mão", "Tỵ", "Dậu"],
  }),
  "Vũ Khúc": stateMap({
    M: ["Thìn", "Tuất", "Sửu", "Mùi"],
    V: ["Dần", "Thân", "Tý", "Ngọ"],
    "Đ": ["Mão", "Dậu"],
    H: ["Tỵ", "Hợi"],
  }),
  "Thiên Tướng": stateMap({
    M: ["Dần", "Thân"],
    V: ["Tý", "Ngọ", "Thìn", "Tuất"],
    "Đ": ["Sửu", "Mùi", "Tỵ", "Hợi"],
    H: ["Mão", "Dậu"],
  }),
  "Thất Sát": stateMap({
    M: ["Dần", "Thân", "Tý", "Ngọ"],
    V: ["Tỵ", "Hợi"],
    "Đ": ["Sửu", "Mùi"],
    H: ["Mão", "Dậu", "Thìn", "Tuất"],
  }),
  "Phá Quân": stateMap({
    M: ["Tý", "Ngọ"],
    V: ["Sửu", "Mùi"],
    "Đ": ["Thìn", "Tuất"],
    H: ["Dần", "Thân", "Tỵ", "Hợi", "Mão", "Dậu"],
  }),
  "Liêm Trinh": stateMap({
    M: ["Dần", "Thân", "Tý", "Ngọ"],
    V: ["Thìn", "Tuất"],
    "Đ": ["Sửu", "Mùi"],
    H: ["Tỵ", "Hợi", "Mão", "Dậu"],
  }),
  "Tham Lang": stateMap({
    M: ["Sửu", "Thìn", "Tuất"],
    V: ["Mùi"],
    "Đ": ["Dần", "Thân"],
    H: ["Tỵ", "Hợi", "Tý", "Ngọ", "Mão", "Dậu"],
  }),
  "Thiên Cơ": stateMap({
    M: ["Mão", "Thìn", "Dậu"],
    V: ["Tuất", "Tỵ", "Thân", "Mùi"],
    "Đ": ["Ngọ", "Tý", "Sửu"],
    H: ["Dần", "Hợi"],
  }),
  "Thái Âm": stateMap({
    M: ["Hợi"],
    V: ["Tý", "Thân", "Dậu", "Tuất"],
    "Đ": ["Sửu", "Mùi"],
    H: ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"],
  }),
  "Thiên Đồng": stateMap({
    M: ["Dần", "Thân"],
    V: ["Tý"],
    "Đ": ["Mão", "Tỵ", "Hợi"],
    H: ["Ngọ", "Dậu", "Thìn", "Tuất", "Sửu", "Mùi"],
  }),
  "Thiên Lương": stateMap({
    M: ["Dần", "Thìn", "Thân"],
    V: ["Tý", "Ngọ", "Tuất", "Mão"],
    "Đ": ["Sửu", "Mùi"],
    H: ["Tỵ", "Hợi", "Dậu"],
  }),
  "Cự Môn": stateMap({
    M: ["Mão", "Dậu"],
    V: ["Tý", "Ngọ", "Dần"],
    "Đ": ["Thân", "Hợi"],
    H: ["Tỵ", "Thìn", "Tuất", "Sửu", "Mùi"],
  }),
  "Thái Dương": stateMap({
    M: ["Tỵ", "Ngọ"],
    V: ["Dần", "Mão", "Thìn"],
    "Đ": ["Sửu", "Mùi"],
    H: ["Thân", "Dậu", "Tuất", "Hợi", "Tý"],
  }),
};

const SUPPORT_STAR_STATES: Record<string, Partial<Record<number, StarBrightness>>> = {
  "Kình Dương": stateMap({ "Đ": ["Thìn", "Tuất", "Sửu", "Mùi"], H: ["Tý", "Dần", "Mão", "Tỵ", "Ngọ", "Thân", "Dậu", "Hợi"] }),
  "Đà La": stateMap({ "Đ": ["Thân", "Tỵ", "Hợi"], H: ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"] }),
  "Địa Không": stateMap({ "Đ": ["Dần", "Thân", "Tỵ", "Hợi"], H: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"] }),
  "Địa Kiếp": stateMap({ "Đ": ["Dần", "Thân", "Tỵ", "Hợi"], H: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"] }),
  "Hỏa Tinh": stateMap({ "Đ": ["Dần", "Mão", "Tỵ", "Ngọ"], H: ["Tý", "Sửu", "Thìn", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] }),
  "Linh Tinh": stateMap({ "Đ": ["Thìn", "Tuất", "Sửu", "Mùi"], H: ["Tý", "Dần", "Mão", "Tỵ", "Ngọ", "Thân", "Dậu", "Hợi"] }),
  "Văn Xương": stateMap({ "Đ": ["Tỵ", "Dậu", "Sửu", "Hợi", "Mão", "Mùi"], H: ["Dần", "Thân", "Tý", "Ngọ"], B: ["Thìn", "Tuất"] }),
  "Văn Khúc": stateMap({ "Đ": ["Tỵ", "Dậu", "Sửu", "Hợi", "Mão", "Mùi"], H: ["Dần", "Thân", "Tý", "Ngọ"], B: ["Thìn", "Tuất"] }),
  "Thiên Mã": stateMap({ "Đ": ["Dần", "Thân", "Tỵ", "Hợi"], H: ["Tý", "Ngọ", "Mão", "Dậu"], B: ["Sửu", "Thìn", "Mùi", "Tuất"] }),
  "Thiên Khốc": stateMap({ "Đ": ["Tý", "Ngọ", "Mão", "Dậu", "Mùi"], H: ["Sửu", "Dần", "Thìn", "Tỵ", "Thân", "Tuất", "Hợi"] }),
  "Thiên Hư": stateMap({ H: BRANCHES }),
  "Bạch Hổ": stateMap({ H: BRANCHES }),
  "Tang Môn": stateMap({ H: BRANCHES }),
  "Thiên Hình": stateMap({ H: BRANCHES }),
  "Thiên Riêu": stateMap({ "Đ": ["Mão", "Dậu", "Tý", "Ngọ"], H: ["Thìn", "Tuất", "Sửu", "Mùi"], B: ["Dần", "Tỵ", "Thân", "Hợi"] }),
  "Đại Hao": stateMap({ H: BRANCHES }),
  "Tiểu Hao": stateMap({ H: BRANCHES }),
  "Hóa Kỵ": stateMap({ H: BRANCHES }),
  "Hóa Lộc": stateMap({ "Đ": BRANCHES }),
  "Hóa Quyền": stateMap({ "Đ": BRANCHES }),
  "Hóa Khoa": stateMap({ "Đ": BRANCHES }),
};

const BONE_YEAR_WEIGHTS: Record<string, number> = {
  "Giáp Tý": 12,
  "Bính Tý": 16,
  "Mậu Tý": 15,
  "Canh Tý": 7,
  "Nhâm Tý": 5,
  "Ất Sửu": 9,
  "Đinh Sửu": 8,
  "Kỷ Sửu": 8,
  "Tân Sửu": 7,
  "Quý Sửu": 5,
  "Bính Dần": 6,
  "Mậu Dần": 8,
  "Canh Dần": 9,
  "Nhâm Dần": 9,
  "Giáp Dần": 12,
  "Đinh Mão": 7,
  "Kỷ Mão": 19,
  "Tân Mão": 12,
  "Quý Mão": 12,
  "Ất Mão": 8,
  "Mậu Thìn": 12,
  "Canh Thìn": 12,
  "Nhâm Thìn": 10,
  "Giáp Thìn": 8,
  "Bính Thìn": 8,
  "Kỷ Tỵ": 5,
  "Tân Tỵ": 6,
  "Quý Tỵ": 7,
  "Ất Tỵ": 7,
  "Đinh Tỵ": 6,
  "Canh Ngọ": 9,
  "Nhâm Ngọ": 8,
  "Giáp Ngọ": 15,
  "Bính Ngọ": 13,
  "Mậu Ngọ": 19,
  "Tân Mùi": 8,
  "Quý Mùi": 7,
  "Ất Mùi": 6,
  "Đinh Mùi": 5,
  "Kỷ Mùi": 6,
  "Nhâm Thân": 7,
  "Giáp Thân": 5,
  "Bính Thân": 5,
  "Mậu Thân": 14,
  "Canh Thân": 8,
  "Quý Dậu": 8,
  "Ất Dậu": 15,
  "Đinh Dậu": 14,
  "Kỷ Dậu": 5,
  "Tân Dậu": 16,
  "Giáp Tuất": 5,
  "Bính Tuất": 6,
  "Mậu Tuất": 15,
  "Canh Tuất": 9,
  "Nhâm Tuất": 10,
  "Ất Hợi": 9,
  "Đinh Hợi": 16,
  "Kỷ Hợi": 9,
  "Tân Hợi": 17,
  "Quý Hợi": 7,
};

const BONE_MONTH_WEIGHTS = [0, 6, 7, 18, 9, 15, 16, 9, 15, 18, 18, 9, 5];
const BONE_DAY_WEIGHTS = [0, 5, 10, 8, 15, 15, 15, 8, 16, 8, 16, 9, 17, 8, 17, 10, 8, 9, 18, 5, 15, 10, 9, 8, 9, 15, 18, 7, 8, 16, 6];
const BONE_HOUR_WEIGHTS = [16, 6, 7, 10, 9, 16, 10, 8, 8, 9, 6, 6];

const NAP_AM_MATRIX: (string | false)[][] = [
  [],
  [false, "K1", false, "T1", false, "H1", false, "O1", false, "M1", false],
  [false, false, "K1", false, "T1", false, "H1", false, "O1", false, "M1"],
  [false, "T2", false, "H2", false, "O2", false, "M2", false, "K2", false],
  [false, false, "T2", false, "H2", false, "O2", false, "M2", false, "K2"],
  [false, "H3", false, "O3", false, "M3", false, "K3", false, "T3", false],
  [false, false, "H3", false, "O3", false, "M3", false, "K3", false, "T3"],
  [false, "K4", false, "T4", false, "H4", false, "O4", false, "M4", false],
  [false, false, "K4", false, "T4", false, "H4", false, "O4", false, "M4"],
  [false, "T5", false, "H5", false, "O5", false, "M5", false, "K5", false],
  [false, false, "T5", false, "H5", false, "O5", false, "M5", false, "K5"],
  [false, "H6", false, "O6", false, "M6", false, "K6", false, "T6", false],
  [false, false, "H6", false, "O6", false, "M6", false, "K6", false, "T6"],
];
const NAP_AM_NAMES: Record<string, string> = {
  K1: "Hải Trung Kim",
  T1: "Giáng Hạ Thủy",
  H1: "Tích Lịch Hỏa",
  O1: "Bích Thượng Thổ",
  M1: "Tang Đố Mộc",
  T2: "Đại Khê Thủy",
  H2: "Lư Trung Hỏa",
  O2: "Thành Đầu Thổ",
  M2: "Tòng Bá Mộc",
  K2: "Kim Bạch Kim",
  H3: "Phú Đăng Hỏa",
  O3: "Sa Trung Thổ",
  M3: "Đại Lâm Mộc",
  K3: "Bạch Lạp Kim",
  T3: "Trường Lưu Thủy",
  K4: "Sa Trung Kim",
  T4: "Thiên Hà Thủy",
  H4: "Thiên Thượng Hỏa",
  O4: "Lộ Bàng Thổ",
  M4: "Dương Liễu Mộc",
  T5: "Tuyền Trung Thủy",
  H5: "Sơn Hạ Hỏa",
  O5: "Đại Trạch Thổ",
  M5: "Thạch Lựu Mộc",
  K5: "Kiếm Phong Kim",
  H6: "Sơn Đầu Hỏa",
  O6: "Ốc Thượng Thổ",
  M6: "Bình Địa Mộc",
  K6: "Xoa Xuyến Kim",
  T6: "Đại Hải Thủy",
};

function mod(value: number, base: number) {
  return ((value % base) + base) % base;
}

function toOneBased(index: number) {
  return index + 1;
}

function toZeroBased(cung: number) {
  return mod(cung - 1, 12);
}

function dichCung(cungBanDau: number, ...steps: number[]) {
  return toOneBased(mod(steps.reduce((cung, step) => cung + step, cungBanDau) - 1, 12));
}

function timezoneOffset(timezone?: string) {
  if (!timezone || timezone === "Asia/Bangkok" || timezone === "Asia/Ho_Chi_Minh") return 7;
  if (timezone === "UTC") return 0;
  const match = timezone.match(/^UTC([+-]\d{1,2})$/);
  return match ? Number(match[1]) : 7;
}

export function getHourBranchIndex(hour: number) {
  if (hour < 0 || hour > 23) return 0;
  return Math.floor(((hour + 1) % 24) / 2);
}

function canChi(stemIndex: number, branchIndex: number) {
  return `${STEMS[mod(stemIndex, 10)]} ${BRANCHES[mod(branchIndex, 12)]}`;
}

function canChiYear(year: number) {
  return canChi(year - 4, year - 4);
}

function canChiMonth(yearStem: number, lunarMonth: number) {
  return canChi(yearStem * 2 + lunarMonth + 1, lunarMonth + 1);
}

function canChiDay(julianDay: number) {
  return canChi(julianDay + 9, julianDay + 1);
}

function canChiHour(dayStem: number, hourBranch: number) {
  return canChi((dayStem % 5) * 2 + hourBranch, hourBranch);
}

function resolveDates(input: ChartInput) {
  const tz = timezoneOffset(input.timezone);
  if (input.calendarType === "lunar") {
    const solar = lunarToSolar(input.day, input.month, input.year, false, tz);
    return {
      solar,
      lunar: { day: input.day, month: input.month, year: input.year, leap: false },
      timezoneOffset: tz,
    };
  }
  return {
    solar: { day: input.day, month: input.month, year: input.year },
    lunar: solarToLunar(input.day, input.month, input.year, tz),
    timezoneOffset: tz,
  };
}

function napAmCode(branchOne: number, stemOne: number) {
  const code = NAP_AM_MATRIX[branchOne]?.[stemOne];
  if (!code) throw new Error(`Không tìm được nạp âm cho chi ${branchOne}, can ${stemOne}`);
  return code;
}

function nguHanhNapAm(branchOne: number, stemOne: number): CucElement {
  return napAmCode(branchOne, stemOne).slice(0, 1) as CucElement;
}

function banMenhNapAm(yearStem: number, yearBranch: number) {
  const code = napAmCode(toOneBased(yearBranch), toOneBased(yearStem));
  return NAP_AM_NAMES[code] || code;
}

function banMenhElement(yearStem: number, yearBranch: number) {
  return nguHanhNapAm(toOneBased(yearBranch), toOneBased(yearStem));
}

function sinh(element: CucElement) {
  return { M: "H", H: "O", O: "K", K: "T", T: "M" }[element] as CucElement;
}

function khac(element: CucElement) {
  return { M: "O", O: "T", T: "H", H: "K", K: "M" }[element] as CucElement;
}

function menhCucRelation(menhElement: CucElement, cucElement: CucElement) {
  const menhLabel = ELEMENT_NAMES[menhElement];
  const cucLabel = ELEMENT_NAMES[cucElement];
  if (menhElement === cucElement) return `Mệnh ${menhLabel} hòa Cục ${cucLabel}`;
  if (sinh(menhElement) === cucElement) return `Mệnh ${menhLabel} sinh Cục ${cucLabel}`;
  if (sinh(cucElement) === menhElement) return `Cục ${cucLabel} sinh Mệnh ${menhLabel}`;
  if (khac(menhElement) === cucElement) return `Mệnh ${menhLabel} khắc Cục ${cucLabel}`;
  if (khac(cucElement) === menhElement) return `Cục ${cucLabel} khắc Mệnh ${menhLabel}`;
  return "Mệnh Cục bình hòa";
}

function menhChu(branchIndex: number) {
  return ["Tham Lang", "Cự Môn", "Lộc Tồn", "Văn Khúc", "Liêm Trinh", "Vũ Khúc", "Phá Quân", "Vũ Khúc", "Liêm Trinh", "Văn Khúc", "Lộc Tồn", "Cự Môn"][branchIndex];
}

function thanChu(yearBranch: number) {
  return ["Linh Tinh", "Thiên Tướng", "Thiên Lương", "Thiên Đồng", "Văn Xương", "Thiên Cơ", "Hỏa Tinh", "Thiên Cơ", "Văn Xương", "Thiên Đồng", "Thiên Lương", "Thiên Cơ"][yearBranch];
}

function palaceStemIndex(yearStem: number, branchIndex: number) {
  return mod(yearStem * 2 + 2 + mod(branchIndex - 2, 12), 10);
}

function findLaiNhan(palaces: Palace[], yearStem: number) {
  return palaces.find((palace) => palaceStemIndex(yearStem, palace.index) === yearStem)?.name || "Đang cập nhật";
}

function findCucIndex(yearStem: number, menhIndex: number) {
  const canNam = toOneBased(yearStem);
  const cungMenh = toOneBased(menhIndex);
  const canThangGieng = (canNam * 2 + 1) % 10;
  const canThangMenhRaw = (mod(cungMenh - 3, 12) + canThangGieng) % 10;
  const canThangMenh = canThangMenhRaw === 0 ? 10 : canThangMenhRaw;
  const element = nguHanhNapAm(cungMenh, canThangMenh);
  const index = CUCS.findIndex((cuc) => cuc.element === element);
  return index >= 0 ? index : 0;
}

function findTuViPalace(cucNumber: number, lunarDay: number) {
  let cungDan = 3;
  let cursor = cucNumber;
  while (cursor < lunarDay) {
    cursor += cucNumber;
    cungDan += 1;
  }
  const diff = cursor - lunarDay;
  const signedDiff = diff % 2 === 1 ? -diff : diff;
  return dichCung(cungDan, signedDiff);
}

function trangSinhPalace(cucNumber: number) {
  if (cucNumber === 6) return 3;
  if (cucNumber === 4) return 6;
  if (cucNumber === 2 || cucNumber === 5) return 9;
  if (cucNumber === 3) return 12;
  return 9;
}

function put(map: Map<number, string[]>, branchIndex: number, star: string) {
  const stars = map.get(branchIndex) || [];
  if (!stars.includes(star)) stars.push(star);
  map.set(branchIndex, stars);
}

function putOneBased(map: Map<number, string[]>, palace: number, star: string) {
  put(map, toZeroBased(palace), star);
}

function findStarPalace(map: Map<number, string[]>, star: string) {
  return Array.from(map.entries()).find(([, stars]) => stars.includes(star))?.[0];
}

function rootStarName(star: string) {
  return star
    .replace(/^L\./, "")
    .replace(/^Lưu\s+/, "")
    .replace(/\s*\(.+\)$/, "")
    .trim();
}

function brightnessFor(star: string, branchIndex: number): StarBrightness | undefined {
  if (star.startsWith("L.") || star.startsWith("LN ")) return undefined;
  const root = rootStarName(star);
  if (root === "Vô chính diệu" || root === "Tuần" || root === "Triệt") return undefined;

  const table = MAIN_STAR_STATES[root] || SUPPORT_STAR_STATES[root];
  const state = table?.[branchIndex];
  if (state) return state;
  if (MAIN_STAR_NAMES.includes(root)) return "B";
  return "B";
}

function buildStarStateMap(branchIndex: number, ...starGroups: string[][]) {
  const states: Record<string, StarBrightness> = {};
  for (const star of starGroups.flat()) {
    const state = brightnessFor(star, branchIndex);
    if (state) states[star] = state;
  }
  return states;
}

function formatBoneWeight(totalChi: number) {
  const luong = Math.floor(totalChi / 10);
  const chi = totalChi % 10;
  return `${luong} lượng ${chi} chỉ`;
}

function calculateBoneWeight(params: {
  lunar: { day: number; month: number; year: number };
  hourBranch: number;
  yearCanChi: string;
}): BoneWeight {
  const year = BONE_YEAR_WEIGHTS[params.yearCanChi] || 0;
  const month = BONE_MONTH_WEIGHTS[params.lunar.month] || 0;
  const day = BONE_DAY_WEIGHTS[params.lunar.day] || 0;
  const hour = BONE_HOUR_WEIGHTS[params.hourBranch] || 0;
  const totalChi = year + month + day + hour;
  return {
    totalChi,
    label: formatBoneWeight(totalChi),
    parts: { year, month, day, hour },
  };
}

function buildMainStarMap(tuViPalace: number) {
  const map = new Map<number, string[]>();
  const tuViOffsets = [0, 4, 7, 8, 9, 11];
  const thienPhuPalace = dichCung(3, 3 - tuViPalace);
  const thienPhuOffsets = [0, 1, 2, 3, 4, 5, 6, 10];

  MAIN_STAR_NAMES.slice(0, 6).forEach((star, index) => putOneBased(map, dichCung(tuViPalace, tuViOffsets[index]), star));
  MAIN_STAR_NAMES.slice(6).forEach((star, index) => putOneBased(map, dichCung(thienPhuPalace, thienPhuOffsets[index]), star));

  return map;
}

function findHoaLinh(chiNam: number, gioSinh: number, genderFactor: number, amDuongNamSinh: number) {
  let hoaStart = 2;
  let linhStart = 4;
  if ([3, 7, 11].includes(chiNam)) {
    hoaStart = 2;
    linhStart = 4;
  } else if ([1, 5, 9].includes(chiNam)) {
    hoaStart = 3;
    linhStart = 11;
  } else if ([6, 10, 2].includes(chiNam)) {
    hoaStart = 11;
    linhStart = 4;
  } else if ([12, 4, 8].includes(chiNam)) {
    hoaStart = 10;
    linhStart = 11;
  }

  if (genderFactor * amDuongNamSinh === -1) {
    return [dichCung(hoaStart + 1, -gioSinh), dichCung(linhStart - 1, gioSinh)];
  }
  return [dichCung(hoaStart - 1, gioSinh), dichCung(linhStart + 1, -gioSinh)];
}

function findThienKhoi(canNam: number) {
  return [0, 2, 1, 12, 10, 8, 1, 8, 7, 6, 4][canNam];
}

function findThienQuanPhuc(canNam: number) {
  return {
    quan: [0, 8, 5, 6, 3, 4, 10, 12, 10, 11, 7][canNam],
    phuc: [0, 10, 9, 1, 12, 4, 3, 7, 6, 7, 6][canNam],
  };
}

function findCoThan(chiNam: number) {
  if ([12, 1, 2].includes(chiNam)) return 3;
  if ([3, 4, 5].includes(chiNam)) return 6;
  if ([6, 7, 8].includes(chiNam)) return 9;
  return 12;
}

function findThienMa(chiNam: number) {
  const demNghich = chiNam % 4;
  if (demNghich === 1) return 3;
  if (demNghich === 2) return 12;
  if (demNghich === 3) return 9;
  return 6;
}

function findPhaToai(chiNam: number) {
  const demNghich = chiNam % 3;
  if (demNghich === 0) return 6;
  if (demNghich === 1) return 10;
  return 2;
}

function findTriet(canNam: number) {
  if ([1, 6].includes(canNam)) return [9, 10];
  if ([2, 7].includes(canNam)) return [7, 8];
  if ([3, 8].includes(canNam)) return [5, 6];
  if ([4, 9].includes(canNam)) return [3, 4];
  return [1, 2];
}

function findLuuHaThienTru(canNam: number) {
  return {
    luuHa: [0, 10, 11, 8, 5, 6, 7, 9, 4, 12, 3][canNam],
    thienTru: [0, 6, 7, 1, 6, 7, 9, 3, 7, 10, 11][canNam],
  };
}

function buildSupportStarMap(params: {
  lunarMonth: number;
  lunarDay: number;
  hourBranch: number;
  yearStem: number;
  yearBranch: number;
  menhIndex: number;
  thanIndex: number;
  gender: Gender;
  mainStarMap: Map<number, string[]>;
}) {
  const map = new Map<number, string[]>();
  const canNam = toOneBased(params.yearStem);
  const chiNam = toOneBased(params.yearBranch);
  const gioSinh = toOneBased(params.hourBranch);
  const menh = toOneBased(params.menhIndex);
  const than = toOneBased(params.thanIndex);
  const genderFactor = params.gender === "male" ? 1 : -1;
  const amDuongNamSinh = params.yearStem % 2 === 0 ? 1 : -1;
  const direction = genderFactor * amDuongNamSinh;
  const locTon = toOneBased(LOC_TON_BY_STEM[params.yearStem]);

  DOCTOR_CYCLE.forEach((star, index) => putOneBased(map, dichCung(locTon, index * direction), star));
  THAI_TUE_CYCLE.forEach((stars, index) => stars.forEach((star) => putOneBased(map, dichCung(chiNam, index), star)));

  putOneBased(map, locTon, "Lộc Tồn");
  putOneBased(map, dichCung(locTon, 1), "Kình Dương");
  putOneBased(map, dichCung(locTon, -1), "Đà La");

  const diaKiep = dichCung(11, gioSinh);
  const diaKhong = dichCung(12, 12 - diaKiep);
  putOneBased(map, diaKiep, "Địa Kiếp");
  putOneBased(map, diaKhong, "Địa Không");

  const [hoaTinh, linhTinh] = findHoaLinh(chiNam, gioSinh, genderFactor, amDuongNamSinh);
  putOneBased(map, hoaTinh, "Hỏa Tinh");
  putOneBased(map, linhTinh, "Linh Tinh");

  const longTri = dichCung(5, chiNam - 1);
  const phuongCac = dichCung(2, 2 - longTri);
  putOneBased(map, longTri, "Long Trì");
  putOneBased(map, phuongCac, "Phượng Các");
  putOneBased(map, phuongCac, "Giải Thần");

  const taPhu = dichCung(5, params.lunarMonth - 1);
  const huuBat = dichCung(2, 2 - taPhu);
  putOneBased(map, taPhu, "Tả Phù");
  putOneBased(map, huuBat, "Hữu Bật");

  const vanKhuc = dichCung(5, gioSinh - 1);
  const vanXuong = dichCung(2, 2 - vanKhuc);
  putOneBased(map, vanKhuc, "Văn Khúc");
  putOneBased(map, vanXuong, "Văn Xương");

  const tamThai = dichCung(5, params.lunarMonth + params.lunarDay - 2);
  const batToa = dichCung(2, 2 - tamThai);
  putOneBased(map, tamThai, "Tam Thai");
  putOneBased(map, batToa, "Bát Tọa");

  const anQuang = dichCung(vanXuong, params.lunarDay - 2);
  const thienQuy = dichCung(2, 2 - anQuang);
  putOneBased(map, anQuang, "Ân Quang");
  putOneBased(map, thienQuy, "Thiên Quý");

  const thienKhoi = findThienKhoi(canNam);
  const thienViet = dichCung(5, 5 - thienKhoi);
  putOneBased(map, thienKhoi, "Thiên Khôi");
  putOneBased(map, thienViet, "Thiên Việt");

  putOneBased(map, dichCung(7, chiNam - 1), "Thiên Hư");
  putOneBased(map, dichCung(7, -chiNam + 1), "Thiên Khốc");
  putOneBased(map, dichCung(menh, chiNam - 1), "Thiên Tài");
  putOneBased(map, dichCung(than, chiNam - 1), "Thiên Thọ");

  const hongLoan = dichCung(4, -chiNam + 1);
  putOneBased(map, hongLoan, "Hồng Loan");
  putOneBased(map, dichCung(hongLoan, 6), "Thiên Hỷ");

  const { quan: thienQuan, phuc: thienPhuc } = findThienQuanPhuc(canNam);
  putOneBased(map, thienQuan, "Thiên Quan");
  putOneBased(map, thienPhuc, "Thiên Phúc");

  const thienHinh = dichCung(10, params.lunarMonth - 1);
  const thienRieu = dichCung(thienHinh, 4);
  putOneBased(map, thienHinh, "Thiên Hình");
  putOneBased(map, thienRieu, "Thiên Riêu");
  putOneBased(map, thienRieu, "Thiên Y");

  const coThan = findCoThan(chiNam);
  putOneBased(map, coThan, "Cô Thần");
  putOneBased(map, dichCung(coThan, -4), "Quả Tú");

  const vanTinh = dichCung(dichCung(locTon, 1), 2);
  const duongPhu = dichCung(vanTinh, 2);
  putOneBased(map, vanTinh, "Văn Tinh");
  putOneBased(map, duongPhu, "Đường Phù");
  putOneBased(map, dichCung(duongPhu, 3), "Quốc Ấn");
  putOneBased(map, dichCung(vanKhuc, 2), "Thai Phụ");
  putOneBased(map, dichCung(vanKhuc, -2), "Phong Cáo");
  putOneBased(map, dichCung(9, 2 * params.lunarMonth - 2), "Thiên Giải");
  putOneBased(map, dichCung(taPhu, 3), "Địa Giải");
  putOneBased(map, 5, "Thiên La");
  putOneBased(map, 11, "Địa Võng");
  putOneBased(map, dichCung(menh, 5), "Thiên Thương");
  putOneBased(map, dichCung(menh, 7), "Thiên Sứ");

  const thienMa = findThienMa(chiNam);
  const hoaCai = dichCung(thienMa, 2);
  const kiepSat = dichCung(thienMa, 3);
  const daoHoa = dichCung(kiepSat, 4);
  putOneBased(map, thienMa, "Thiên Mã");
  putOneBased(map, hoaCai, "Hoa Cái");
  putOneBased(map, kiepSat, "Kiếp Sát");
  putOneBased(map, daoHoa, "Đào Hoa");
  putOneBased(map, findPhaToai(chiNam), "Phá Toái");
  putOneBased(map, dichCung(chiNam, -params.lunarMonth + gioSinh), "Đẩu Quân");

  const { luuHa, thienTru } = findLuuHaThienTru(canNam);
  putOneBased(map, luuHa, "Lưu Hà");
  putOneBased(map, thienTru, "Thiên Trù");

  const ketThucTuan = dichCung(chiNam, 10 - canNam);
  putOneBased(map, dichCung(ketThucTuan, 1), "Tuần");
  putOneBased(map, dichCung(ketThucTuan, 2), "Tuần");
  findTriet(canNam).forEach((palace) => putOneBased(map, palace, "Triệt"));

  const transforms = FOUR_TRANSFORMS[params.yearStem];
  const transformLabels = [
    ["Hóa Lộc", transforms.loc],
    ["Hóa Quyền", transforms.quyen],
    ["Hóa Khoa", transforms.khoa],
    ["Hóa Kỵ", transforms.ky],
  ] as const;

  for (const [label, target] of transformLabels) {
    const mainBranch = findStarPalace(params.mainStarMap, target);
    const supportBranch = findStarPalace(map, target);
    put(map, mainBranch ?? supportBranch ?? toZeroBased(locTon), `${label} (${target})`);
  }

  return map;
}

function buildYearlyStarMap(viewYear: number) {
  const map = new Map<number, string[]>();
  const viewStem = mod(viewYear - 4, 10);
  const viewBranch = mod(viewYear - 4, 12);
  const viewBranchOne = toOneBased(viewBranch);
  const locTon = LOC_TON_BY_STEM[viewStem];

  put(map, viewBranch, "LN Văn tinh");
  put(map, viewBranch, "L.Thái Tuế");
  put(map, mod(viewBranch + 2, 12), "L.Tang Môn");
  put(map, mod(viewBranch + 8, 12), "L.Bạch Hổ");

  put(map, locTon, "L.Lộc Tồn");
  put(map, mod(locTon + 1, 12), "L.Kình Dương");
  put(map, mod(locTon - 1, 12), "L.Đà La");
  putOneBased(map, findThienMa(viewBranchOne), "L.Thiên Mã");
  putOneBased(map, dichCung(7, viewBranchOne - 1), "L.Thiên Hư");
  putOneBased(map, dichCung(7, -viewBranchOne + 1), "L.Thiên Khốc");

  return map;
}

function lifecycleFor(branchIndex: number, cucNumber: number, forward: boolean) {
  const start = toZeroBased(trangSinhPalace(cucNumber));
  const offset = forward ? mod(branchIndex - start, 12) : mod(start - branchIndex, 12);
  return LIFECYCLE[offset];
}

export function generateTuViChart(input: ChartInput): TuViChart {
  const normalized: ChartInput = {
    ...input,
    fullName: input.fullName.trim() || "Ẩn danh",
    timezone: input.timezone || "Asia/Bangkok",
  };
  const { solar, lunar } = resolveDates(normalized);
  const hourBranch = getHourBranchIndex(normalized.birthHour);
  const monthAnchor = mod(2 + lunar.month - 1, 12);
  const menhIndex = mod(monthAnchor - hourBranch, 12);
  const thanIndex = mod(monthAnchor + hourBranch, 12);
  const yearStem = mod(lunar.year - 4, 10);
  const yearBranch = mod(lunar.year - 4, 12);
  const cucIndex = findCucIndex(yearStem, menhIndex);
  const cucNumber = CUCS[cucIndex].number;
  const tuViPalace = findTuViPalace(cucNumber, lunar.day);
  const amDuong = yearStem % 2 === 0 ? "Dương" : "Âm";
  const forward = (normalized.gender === "male" && amDuong === "Dương") || (normalized.gender === "female" && amDuong === "Âm");
  const jd = jdFromDate(solar.day, solar.month, solar.year);
  const dayStem = mod(jd + 9, 10);
  const mainStarMap = buildMainStarMap(tuViPalace);
  const supportStarMap = buildSupportStarMap({
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    hourBranch,
    yearStem,
    yearBranch,
    menhIndex,
    thanIndex,
    gender: normalized.gender,
    mainStarMap,
  });
  const yearlyStarMap = buildYearlyStarMap(normalized.viewYear);
  const banMenh = banMenhNapAm(yearStem, yearBranch);
  const nativeElement = banMenhElement(yearStem, yearBranch);
  const cucElement = CUCS[cucIndex].element;
  const yearCanChi = canChiYear(lunar.year);
  const boneWeight = calculateBoneWeight({ lunar, hourBranch, yearCanChi });

  const palaces = Array.from({ length: 12 }, (_, offset) => {
    const branchIndex = mod(menhIndex + offset, 12);
    const mainStars = mainStarMap.get(branchIndex) || ["Vô chính diệu"];
    const supportStars = supportStarMap.get(branchIndex) || [];
    const yearlyStars = yearlyStarMap.get(branchIndex) || [];
    return {
      index: branchIndex,
      branch: BRANCHES[branchIndex],
      name: PALACE_NAMES[offset],
      ageRange: "",
      mainStars,
      supportStars,
      yearlyStars,
      starStates: buildStarStateMap(branchIndex, mainStars, supportStars, yearlyStars),
      lifecycle: lifecycleFor(branchIndex, cucNumber, forward),
      isMenh: offset === 0,
      isThan: branchIndex === thanIndex,
    };
  });

  const orderedForDecades = Array.from({ length: 12 }, (_, index) => palaces[forward ? index : mod(-index, 12)]);
  const daiVan = orderedForDecades.map((palace, index) => ({
    palace: palace.name,
    branch: palace.branch,
    range: `${cucNumber + index * 10}-${cucNumber + index * 10 + 9}`,
  }));

  const ageRangeByPalace = new Map(daiVan.map((item) => [item.palace, item.range]));
  const palacesWithDecades = palaces.map((palace) => ({
    ...palace,
    ageRange: ageRangeByPalace.get(palace.name) || `${cucNumber}-${cucNumber + 9}`,
  }));
  const laiNhan = findLaiNhan(palacesWithDecades, yearStem);

  return {
    input: normalized,
    generatedAt: new Date().toISOString(),
    solar,
    lunar,
    canChi: {
      year: yearCanChi,
      month: canChiMonth(yearStem, lunar.month),
      day: canChiDay(jd),
      hour: canChiHour(dayStem, hourBranch),
    },
    menh: BRANCHES[menhIndex],
    than: BRANCHES[thanIndex],
    cuc: CUCS[cucIndex].label,
    banMenh,
    cucElement: ELEMENT_NAMES[cucElement],
    menhChu: menhChu(yearBranch),
    thanChu: thanChu(yearBranch),
    menhCucRelation: menhCucRelation(nativeElement, cucElement),
    amDuong,
    boneWeight,
    laiNhan,
    palaces: palacesWithDecades,
    daiVan,
    summary: [
      `Mệnh an tại ${BRANCHES[menhIndex]}, Thân an tại ${BRANCHES[thanIndex]}.`,
      `Ngày dương ${solar.day}/${solar.month}/${solar.year}; âm lịch ${lunar.day}/${lunar.month}/${lunar.year}${lunar.leap ? " nhuận" : ""}.`,
      `Năm sinh ${yearCanChi}, ${amDuong} ${normalized.gender === "male" ? "nam" : "nữ"}, bản mệnh ${banMenh}, ${CUCS[cucIndex].label} (${ELEMENT_NAMES[CUCS[cucIndex].element]}), cân lượng ${boneWeight.label}.`,
      `Cục được tính bằng ngũ hành nạp âm của cung Mệnh và can tháng Mệnh; sao Tử Vi an theo cục số ${cucNumber} và ngày âm ${lunar.day}.`,
    ],
    engine: {
      version: CHART_ENGINE_VERSION,
      calendar: "Vietnamese lunar calendar, UTC+7, Ho Ngoc Duc/Jean Meeus style algorithm",
      starProfile: "tracuutuvi-compatible",
      notes: [
        "Âm lịch, Can Chi ngày và Can Chi giờ được tính từ Julian day.",
        "Mệnh/Thân, Cục, Tử Vi tinh hệ, Thiên Phủ tinh hệ, Lộc Tồn, Thái Tuế, Tràng Sinh, Tứ Hóa, Tuần/Triệt và các phụ tinh phổ thông được an bằng bảng/công thức truyền thống.",
        "Mỗi sao gốc có trạng thái Miếu/Vượng/Đắc/Bình/Hãm khi bảng cổ điển có quy ước; sao lưu niên hiển thị theo hồ sơ tracuutuvi gồm L.Thái Tuế, L.Lộc Tồn, L.Thiên Mã, L.Kình Dương, L.Đà La, L.Thiên Khốc, L.Thiên Hư, L.Tang Môn, L.Bạch Hổ và LN Văn tinh.",
        "Cân lượng cốt được tính theo bảng cân xương đoán số trên năm/tháng/ngày/giờ âm lịch.",
        "Engine bám nguồn mở lasotuvi MIT và quy ước phổ thông Việt Nam; các sao chuyên sâu hiếm gặp vẫn cần tiếp tục bổ sung bằng fixture đối chiếu.",
      ],
    },
  };
}
