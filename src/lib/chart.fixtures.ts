import type { ChartInput } from "@/lib/chart";

type FixturePalaceStars = Record<string, string[]>;
type FixturePalaceStates = Record<string, Record<string, string>>;

export type ChartFixture = {
  id: string;
  source: string;
  input: ChartInput;
  expected: {
    solar: { day: number; month: number; year: number };
    lunar: { day: number; month: number; year: number; leap: boolean };
    canChi: { year: string; month: string; day: string; hour: string };
    menh: string;
    than: string;
    cuc: string;
    banMenh: string;
    menhChu: string;
    thanChu: string;
    laiNhan?: string;
    menhCucRelation: string;
    firstDaiVan: { palace: string; branch: string; range: string };
    boneWeightLabel?: string;
    mainStarsByPalace: FixturePalaceStars;
    supportStarsInclude?: FixturePalaceStars;
    yearlyStarsInclude?: FixturePalaceStars;
    starStatesInclude?: FixturePalaceStates;
  };
};

export const CHART_FIXTURES: ChartFixture[] = [
  {
    id: "aituvi-reference-1995-suu-hour",
    source: "Reference image supplied by user, cross-checked against lasotuvi-style star placement rules",
    input: {
      fullName: "Hứa Thị Thúy Hằng",
      gender: "male",
      calendarType: "solar",
      day: 3,
      month: 4,
      year: 1995,
      birthHour: 1,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    },
    expected: {
      solar: { day: 3, month: 4, year: 1995 },
      lunar: { day: 4, month: 3, year: 1995, leap: false },
      canChi: { year: "Ất Hợi", month: "Canh Thìn", day: "Giáp Tý", hour: "Ất Sửu" },
      menh: "Mão",
      than: "Tỵ",
      cuc: "Thổ ngũ cục",
      banMenh: "Sơn Đầu Hỏa",
      menhChu: "Cự Môn",
      thanChu: "Thiên Cơ",
      laiNhan: "Thiên Di",
      menhCucRelation: "Mệnh Hỏa sinh Cục Thổ",
      firstDaiVan: { palace: "Mệnh", branch: "Mão", range: "5-14" },
      boneWeightLabel: "4 lượng 8 chỉ",
      mainStarsByPalace: {
        "Mệnh": ["Thiên Phủ"],
        "Phụ Mẫu": ["Thái Âm"],
        "Phúc Đức": ["Liêm Trinh", "Tham Lang"],
        "Điền Trạch": ["Cự Môn"],
        "Quan Lộc": ["Thiên Tướng"],
        "Nô Bộc": ["Thiên Đồng", "Thiên Lương"],
        "Thiên Di": ["Vũ Khúc", "Thất Sát"],
        "Tật Ách": ["Thái Dương"],
        "Tài Bạch": ["Vô chính diệu"],
        "Tử Tức": ["Thiên Cơ"],
        "Phu Thê": ["Tử Vi", "Phá Quân"],
        "Huynh Đệ": ["Vô chính diệu"],
      },
      supportStarsInclude: {
        "Mệnh": ["Lộc Tồn", "Bác Sĩ", "Long Trì", "Thiên Quý"],
        "Phụ Mẫu": ["Kình Dương", "Hóa Kỵ (Thái Âm)"],
        "Nô Bộc": ["Tuần", "Thiên Thương", "Hóa Quyền (Thiên Lương)"],
        "Thiên Di": ["Tuần"],
        "Điền Trạch": ["Triệt"],
        "Quan Lộc": ["Triệt"],
        "Tật Ách": ["Thiên Sứ"],
        "Tử Tức": ["Hóa Lộc (Thiên Cơ)"],
        "Phu Thê": ["Hóa Khoa (Tử Vi)"],
      },
      yearlyStarsInclude: {
        "Phụ Mẫu": ["L.Đà La"],
        "Điền Trạch": ["L.Thái Tuế", "L.Kình Dương"],
        "Nô Bộc": ["L.Tang Môn", "L.Thiên Mã"],
        "Huynh Đệ": ["L.Bạch Hổ"],
      },
      starStatesInclude: {
        "Mệnh": { "Thiên Phủ": "B" },
        "Phúc Đức": { "Liêm Trinh": "H", "Tham Lang": "H" },
        "Quan Lộc": { "Thiên Tướng": "Đ" },
        "Phu Thê": { "Tử Vi": "Đ", "Phá Quân": "V" },
      },
    },
  },
  {
    id: "giap-tuat-1994-suu-hour",
    source: "Rule fixture for Giáp Tuất male chart, covers Hỏa cục and forward đại vận",
    input: {
      fullName: "Kiều Tấn Cường",
      gender: "male",
      calendarType: "solar",
      day: 3,
      month: 4,
      year: 1994,
      birthHour: 1,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    },
    expected: {
      solar: { day: 3, month: 4, year: 1994 },
      lunar: { day: 23, month: 2, year: 1994, leap: false },
      canChi: { year: "Giáp Tuất", month: "Đinh Mão", day: "Kỷ Mùi", hour: "Ất Sửu" },
      menh: "Dần",
      than: "Thìn",
      cuc: "Hỏa lục cục",
      banMenh: "Sơn Đầu Hỏa",
      menhChu: "Lộc Tồn",
      thanChu: "Thiên Lương",
      menhCucRelation: "Mệnh Hỏa hòa Cục Hỏa",
      firstDaiVan: { palace: "Mệnh", branch: "Dần", range: "6-15" },
      mainStarsByPalace: {
        "Mệnh": ["Tham Lang"],
        "Phụ Mẫu": ["Thiên Cơ", "Cự Môn"],
        "Phúc Đức": ["Tử Vi", "Thiên Tướng"],
        "Điền Trạch": ["Thiên Lương"],
        "Quan Lộc": ["Thất Sát"],
        "Nô Bộc": ["Vô chính diệu"],
        "Thiên Di": ["Liêm Trinh"],
        "Tật Ách": ["Vô chính diệu"],
        "Tài Bạch": ["Phá Quân"],
        "Tử Tức": ["Thiên Đồng"],
        "Phu Thê": ["Vũ Khúc", "Thiên Phủ"],
        "Huynh Đệ": ["Thái Dương", "Thái Âm"],
      },
      supportStarsInclude: {
        "Mệnh": ["Lộc Tồn", "Bác Sĩ"],
        "Nô Bộc": ["Thiên Thương"],
        "Thiên Di": ["Hóa Lộc (Liêm Trinh)", "Tuần", "Triệt"],
        "Tật Ách": ["Thiên Sứ"],
        "Tài Bạch": ["Hóa Quyền (Phá Quân)"],
        "Phu Thê": ["Hóa Khoa (Vũ Khúc)"],
      },
    },
  },
  {
    id: "tracuutuvi-pdf-kieu-tan-cuong-1995-dan-hour",
    source: "Golden fixture extracted from user-provided tracuutuvi PDF La_so_tu_vi_KIEU_TAN_CUONG.pdf",
    input: {
      fullName: "Kiều Tấn Cường",
      gender: "male",
      calendarType: "solar",
      day: 7,
      month: 5,
      year: 1995,
      birthHour: 4,
      birthMinute: 26,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    },
    expected: {
      solar: { day: 7, month: 5, year: 1995 },
      lunar: { day: 8, month: 4, year: 1995, leap: false },
      canChi: { year: "Ất Hợi", month: "Tân Tỵ", day: "Mậu Tuất", hour: "Giáp Dần" },
      menh: "Mão",
      than: "Mùi",
      cuc: "Thổ ngũ cục",
      banMenh: "Sơn Đầu Hỏa",
      menhChu: "Cự Môn",
      thanChu: "Thiên Cơ",
      menhCucRelation: "Mệnh Hỏa sinh Cục Thổ",
      firstDaiVan: { palace: "Mệnh", branch: "Mão", range: "5-14" },
      boneWeightLabel: "4 lượng 1 chỉ",
      mainStarsByPalace: {
        "Mệnh": ["Thiên Tướng"],
        "Phụ Mẫu": ["Thiên Cơ", "Thiên Lương"],
        "Phúc Đức": ["Tử Vi", "Thất Sát"],
        "Điền Trạch": ["Vô chính diệu"],
        "Quan Lộc": ["Vô chính diệu"],
        "Nô Bộc": ["Vô chính diệu"],
        "Thiên Di": ["Liêm Trinh", "Phá Quân"],
        "Tật Ách": ["Vô chính diệu"],
        "Tài Bạch": ["Thiên Phủ"],
        "Tử Tức": ["Thiên Đồng", "Thái Âm"],
        "Phu Thê": ["Vũ Khúc", "Tham Lang"],
        "Huynh Đệ": ["Thái Dương", "Cự Môn"],
      },
      supportStarsInclude: {
        "Mệnh": ["Lộc Tồn", "Quan Phù", "Bác Sĩ", "Long Trì"],
        "Phụ Mẫu": ["Kình Dương", "Thiên Riêu", "Hóa Lộc (Thiên Cơ)", "Hóa Quyền (Thiên Lương)"],
        "Phúc Đức": ["Thiên Mã", "Thiên Hư", "Hóa Khoa (Tử Vi)"],
        "Điền Trạch": ["Văn Khúc", "Triệt", "Thiên Trù"],
        "Quan Lộc": ["Hỏa Tinh", "Thiên Khốc", "Triệt"],
        "Nô Bộc": ["Văn Xương", "Thiên Thương", "Thiên Việt", "Thiên Phúc", "Tuần"],
        "Thiên Di": ["Địa Không", "Tuần"],
        "Tử Tức": ["Linh Tinh", "Thiên Hình", "Hóa Kỵ (Thái Âm)"],
        "Phu Thê": ["Tang Môn", "Địa Kiếp"],
        "Huynh Đệ": ["Đà La", "Tam Thai", "Ân Quang"],
      },
      yearlyStarsInclude: {
        "Phụ Mẫu": ["L.Đà La"],
        "Phúc Đức": ["L.Lộc Tồn"],
        "Điền Trạch": ["L.Thái Tuế", "L.Kình Dương", "LN Văn tinh"],
        "Nô Bộc": ["L.Tang Môn", "L.Thiên Mã"],
        "Tử Tức": ["L.Thiên Hư", "L.Thiên Khốc"],
        "Huynh Đệ": ["L.Bạch Hổ"],
      },
      starStatesInclude: {
        "Mệnh": { "Thiên Tướng": "H" },
        "Phụ Mẫu": { "Thiên Cơ": "M", "Thiên Lương": "M", "Kình Dương": "Đ", "Thiên Riêu": "H" },
        "Phúc Đức": { "Tử Vi": "M", "Thất Sát": "V", "Thiên Mã": "Đ" },
        "Điền Trạch": { "Văn Khúc": "H" },
        "Quan Lộc": { "Hỏa Tinh": "H" },
        "Thiên Di": { "Liêm Trinh": "H", "Phá Quân": "H", "Địa Không": "H" },
        "Tài Bạch": { "Thiên Phủ": "Đ" },
        "Tử Tức": { "Thiên Đồng": "V", "Thái Âm": "V", "Linh Tinh": "H", "Thiên Hình": "H" },
        "Phu Thê": { "Vũ Khúc": "M", "Tham Lang": "M", "Tang Môn": "H", "Địa Kiếp": "H" },
        "Huynh Đệ": { "Thái Dương": "V", "Cự Môn": "V", "Đà La": "H" },
      },
    },
  },
  {
    id: "lunar-new-year-2026-ty-hour",
    source: "Lunar-input regression fixture, covers lunar to solar conversion and same Menh/Than palace",
    input: {
      fullName: "Lunar sample",
      gender: "female",
      calendarType: "lunar",
      day: 1,
      month: 1,
      year: 2026,
      birthHour: 23,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    },
    expected: {
      solar: { day: 17, month: 2, year: 2026 },
      lunar: { day: 1, month: 1, year: 2026, leap: false },
      canChi: { year: "Bính Ngọ", month: "Canh Dần", day: "Nhâm Tuất", hour: "Canh Tý" },
      menh: "Dần",
      than: "Dần",
      cuc: "Mộc tam cục",
      banMenh: "Thiên Hà Thủy",
      menhChu: "Phá Quân",
      thanChu: "Hỏa Tinh",
      menhCucRelation: "Mệnh Thủy sinh Cục Mộc",
      firstDaiVan: { palace: "Mệnh", branch: "Dần", range: "3-12" },
      mainStarsByPalace: {
        "Mệnh": ["Tham Lang"],
        "Phụ Mẫu": ["Thiên Cơ", "Cự Môn"],
        "Phúc Đức": ["Tử Vi", "Thiên Tướng"],
        "Điền Trạch": ["Thiên Lương"],
        "Quan Lộc": ["Thất Sát"],
        "Nô Bộc": ["Vô chính diệu"],
        "Thiên Di": ["Liêm Trinh"],
        "Tật Ách": ["Vô chính diệu"],
        "Tài Bạch": ["Phá Quân"],
        "Tử Tức": ["Thiên Đồng"],
        "Phu Thê": ["Vũ Khúc", "Thiên Phủ"],
        "Huynh Đệ": ["Thái Dương", "Thái Âm"],
      },
      supportStarsInclude: {
        "Mệnh": ["Tuần"],
        "Phụ Mẫu": ["Hóa Quyền (Thiên Cơ)", "Tuần"],
        "Nô Bộc": ["Thiên Không", "Thiên Thương"],
        "Tật Ách": ["Thiên Sứ"],
        "Phúc Đức": ["Văn Khúc", "Triệt"],
        "Điền Trạch": ["Lộc Tồn", "Triệt"],
        "Quan Lộc": ["Thái Tuế"],
        "Tài Bạch": ["Văn Xương", "Hóa Khoa (Văn Xương)"],
        "Tử Tức": ["Hóa Lộc (Thiên Đồng)"],
      },
    },
  },
];
