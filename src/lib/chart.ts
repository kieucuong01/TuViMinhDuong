import { jdFromDate, lunarToSolar, solarToLunar, type SolarDate } from "@/lib/lunar";

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
  lifecycle: string;
  isMenh: boolean;
  isThan: boolean;
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
  amDuong: string;
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

const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
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
const YEAR_CYCLE = [
  "Thái Tuế",
  "Thiếu Dương",
  "Tang Môn",
  "Thiếu Âm",
  "Quan Phù",
  "Tử Phù",
  "Tuế Phá",
  "Long Đức",
  "Bạch Hổ",
  "Phúc Đức",
  "Điếu Khách",
  "Trực Phù",
];
const LOC_TON_BY_STEM = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
const TRANG_SINH_BY_CUC = [11, 11, 5, 8, 2];
const LIFECYCLE = ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
const CUCS = [
  { label: "Thủy nhị cục", number: 2 },
  { label: "Mộc tam cục", number: 3 },
  { label: "Kim tứ cục", number: 4 },
  { label: "Thổ ngũ cục", number: 5 },
  { label: "Hỏa lục cục", number: 6 },
];
const FOUR_TRANSFORMS: Record<number, { loc: string; quyen: string; khoa: string; ky: string }> = {
  0: { loc: "Liêm Trinh", quyen: "Phá Quân", khoa: "Vũ Khúc", ky: "Thái Dương" },
  1: { loc: "Thiên Cơ", quyen: "Thiên Lương", khoa: "Tử Vi", ky: "Thái Âm" },
  2: { loc: "Thiên Đồng", quyen: "Thiên Cơ", khoa: "Văn Xương", ky: "Liêm Trinh" },
  3: { loc: "Thái Âm", quyen: "Thiên Đồng", khoa: "Thiên Cơ", ky: "Cự Môn" },
  4: { loc: "Tham Lang", quyen: "Thái Âm", khoa: "Hữu Bật", ky: "Thiên Cơ" },
  5: { loc: "Vũ Khúc", quyen: "Tham Lang", khoa: "Thiên Lương", ky: "Văn Khúc" },
  6: { loc: "Thái Dương", quyen: "Vũ Khúc", khoa: "Thái Âm", ky: "Thiên Đồng" },
  7: { loc: "Cự Môn", quyen: "Thái Dương", khoa: "Văn Khúc", ky: "Văn Xương" },
  8: { loc: "Thiên Lương", quyen: "Tử Vi", khoa: "Tả Phù", ky: "Vũ Khúc" },
  9: { loc: "Phá Quân", quyen: "Cự Môn", khoa: "Thái Âm", ky: "Tham Lang" },
};

function mod(value: number, base: number) {
  return ((value % base) + base) % base;
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

function estimateCuc(yearStem: number, menhIndex: number) {
  return mod(yearStem + menhIndex, CUCS.length);
}

function estimateTuViIndex(lunarDay: number, cucIndex: number, yearBranch: number) {
  return mod(lunarDay + CUCS[cucIndex].number + yearBranch - 1, 12);
}

function put(map: Map<number, string[]>, branchIndex: number, star: string) {
  const stars = map.get(branchIndex) || [];
  if (!stars.includes(star)) stars.push(star);
  map.set(branchIndex, stars);
}

function buildMainStarMap(tuViIndex: number) {
  const map = new Map<number, string[]>();
  const tuViOffsets = [0, 4, 7, 8, 9, 11];
  const thienPhuIndex = mod(4 - tuViIndex, 12);
  const thienPhuOffsets = [0, 1, 2, 3, 4, 5, 6, 10];

  MAIN_STAR_NAMES.slice(0, 6).forEach((star, index) => put(map, mod(tuViIndex + tuViOffsets[index], 12), star));
  MAIN_STAR_NAMES.slice(6).forEach((star, index) => put(map, mod(thienPhuIndex + thienPhuOffsets[index], 12), star));

  return map;
}

function buildSupportStarMap(lunarMonth: number, hourBranch: number, yearStem: number, yearBranch: number, mainStarMap: Map<number, string[]>) {
  const map = new Map<number, string[]>();
  const locTon = LOC_TON_BY_STEM[yearStem];

  put(map, locTon, "Lộc Tồn");
  put(map, mod(locTon + 1, 12), "Kình Dương");
  put(map, mod(locTon - 1, 12), "Đà La");
  put(map, mod(10 - hourBranch, 12), "Văn Xương");
  put(map, mod(4 + hourBranch, 12), "Văn Khúc");
  put(map, mod(4 + lunarMonth - 1, 12), "Tả Phù");
  put(map, mod(10 - lunarMonth + 1, 12), "Hữu Bật");
  put(map, mod(yearBranch + 2, 12), "Đào Hoa");
  put(map, mod(3 - yearBranch, 12), "Hồng Loan");
  put(map, mod(yearBranch + 6, 12), "Thiên Hỷ");
  put(map, mod(yearBranch + 4, 12), "Hoa Cái");
  put(map, mod(yearBranch + 8, 12), "Thiên Mã");

  const transforms = FOUR_TRANSFORMS[yearStem];
  const transformLabels = [
    ["Hóa Lộc", transforms.loc],
    ["Hóa Quyền", transforms.quyen],
    ["Hóa Khoa", transforms.khoa],
    ["Hóa Kỵ", transforms.ky],
  ] as const;

  for (const [label, target] of transformLabels) {
    const mainBranch = Array.from(mainStarMap.entries()).find(([, stars]) => stars.includes(target))?.[0];
    const supportBranch = Array.from(map.entries()).find(([, stars]) => stars.includes(target))?.[0];
    put(map, mainBranch ?? supportBranch ?? mod(yearStem + yearBranch, 12), `${label} (${target})`);
  }

  return map;
}

function yearlyStarsFor(branchIndex: number, viewYear: number) {
  const viewBranch = mod(viewYear - 4, 12);
  const stars = YEAR_CYCLE.filter((_, index) => mod(viewBranch + index, 12) === branchIndex);
  if (branchIndex === viewBranch) stars.push("Lưu Thái Tuế");
  if (branchIndex === mod(viewBranch + 4, 12)) stars.push("Lưu Lộc Tồn");
  return stars;
}

function lifecycleFor(branchIndex: number, cucIndex: number, forward: boolean) {
  const start = TRANG_SINH_BY_CUC[cucIndex];
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
  const cucIndex = estimateCuc(yearStem, menhIndex);
  const tuViIndex = estimateTuViIndex(lunar.day, cucIndex, yearBranch);
  const amDuong = yearStem % 2 === 0 ? "Dương" : "Âm";
  const forward = (normalized.gender === "male" && amDuong === "Dương") || (normalized.gender === "female" && amDuong === "Âm");
  const jd = jdFromDate(solar.day, solar.month, solar.year);
  const dayStem = mod(jd + 9, 10);
  const mainStarMap = buildMainStarMap(tuViIndex);
  const supportStarMap = buildSupportStarMap(lunar.month, hourBranch, yearStem, yearBranch, mainStarMap);
  const cucNumber = CUCS[cucIndex].number;

  const palaces = Array.from({ length: 12 }, (_, offset) => {
    const branchIndex = mod(menhIndex + offset, 12);
    return {
      index: branchIndex,
      branch: BRANCHES[branchIndex],
      name: PALACE_NAMES[offset],
      ageRange: "",
      mainStars: mainStarMap.get(branchIndex) || ["Vô chính diệu"],
      supportStars: supportStarMap.get(branchIndex) || [],
      yearlyStars: yearlyStarsFor(branchIndex, normalized.viewYear),
      lifecycle: lifecycleFor(branchIndex, cucIndex, forward),
      isMenh: offset === 0,
      isThan: branchIndex === thanIndex,
    };
  });

  const orderedForDecades = forward ? palaces : [...palaces].reverse();
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

  return {
    input: normalized,
    generatedAt: new Date().toISOString(),
    solar,
    lunar,
    canChi: {
      year: canChiYear(lunar.year),
      month: canChiMonth(yearStem, lunar.month),
      day: canChiDay(jd),
      hour: canChiHour(dayStem, hourBranch),
    },
    menh: BRANCHES[menhIndex],
    than: BRANCHES[thanIndex],
    cuc: CUCS[cucIndex].label,
    amDuong,
    palaces: palacesWithDecades,
    daiVan,
    summary: [
      `Mệnh an tại ${BRANCHES[menhIndex]}, Thân an tại ${BRANCHES[thanIndex]}.`,
      `Ngày dương ${solar.day}/${solar.month}/${solar.year}; âm lịch ${lunar.day}/${lunar.month}/${lunar.year}${lunar.leap ? " nhuận" : ""}.`,
      `Năm sinh ${canChiYear(lunar.year)}, ${amDuong} ${normalized.gender === "male" ? "nam" : "nữ"}, ${CUCS[cucIndex].label}.`,
      "Engine đã dùng lịch âm Việt Nam theo thuật toán thiên văn, còn bộ an chính tinh đang ở hồ sơ phổ thông beta và cần tiếp tục đối chiếu fixture lá số chuẩn.",
    ],
    engine: {
      version: "0.2.0",
      calendar: "Vietnamese lunar calendar, UTC+7, Ho Ngoc Duc/Jean Meeus style algorithm",
      starProfile: "popular-vn-beta",
      notes: [
        "Âm lịch, Can Chi ngày và Can Chi giờ được tính từ Julian day.",
        "Mệnh/Thân dùng quy tắc tháng âm và giờ sinh phổ thông.",
        "Chính tinh/phụ tinh đang là hồ sơ beta, cần đối chiếu thêm với bộ fixture trước khi gắn nhãn production.",
      ],
    },
  };
}
