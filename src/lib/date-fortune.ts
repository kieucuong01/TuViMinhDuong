import { jdFromDate, solarToLunar } from "@/lib/lunar";

export const stems = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const branches = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const solarTerms = [
  "Tiểu Hàn",
  "Lập Xuân",
  "Kinh Trập",
  "Thanh Minh",
  "Lập Hạ",
  "Mang Chủng",
  "Tiểu Thử",
  "Lập Thu",
  "Bạch Lộ",
  "Hàn Lộ",
  "Lập Đông",
  "Đại Tuyết",
];

const directCycle = ["Kiến", "Trừ", "Mãn", "Bình", "Định", "Chấp", "Phá", "Nguy", "Thành", "Thu", "Khai", "Bế"];
const dayStars = ["Thanh Long", "Minh Đường", "Thiên Hình", "Chu Tước", "Kim Quỹ", "Kim Đường", "Bạch Hổ", "Ngọc Đường", "Thiên Lao", "Nguyên Vũ", "Tư Mệnh", "Câu Trần"];
export type FortuneTone = "good" | "neutral" | "bad";

const goodHourMap: Record<number, number[]> = {
  0: [0, 1, 3, 6, 8, 9],
  1: [2, 3, 5, 8, 10, 11],
  2: [0, 1, 4, 5, 7, 10],
  3: [0, 2, 3, 6, 7, 9],
  4: [2, 4, 5, 8, 9, 11],
  5: [1, 4, 6, 7, 10, 11],
  6: [0, 1, 3, 6, 8, 9],
  7: [2, 3, 5, 8, 10, 11],
  8: [0, 1, 4, 5, 7, 10],
  9: [0, 2, 3, 6, 7, 9],
  10: [2, 4, 5, 8, 9, 11],
  11: [1, 4, 6, 7, 10, 11],
};

function mod(value: number, base: number) {
  return ((value % base) + base) % base;
}

function canChi(stemIndex: number, branchIndex: number) {
  return `${stems[mod(stemIndex, 10)]} ${branches[mod(branchIndex, 12)]}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function toInputDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseInputDate(value: string) {
  return new Date(`${value}T12:00:00+07:00`);
}

export function formatDate(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function getHourRange(branchIndex: number) {
  const start = branchIndex === 0 ? 23 : branchIndex * 2 - 1;
  const end = branchIndex === 0 ? 0 : branchIndex * 2;
  return `${pad(start)}:00 - ${pad(end)}:59`;
}

function scoreDate(jd: number, dayBranch: number, lunarDay: number, directIndex: number) {
  const goodDirect = [1, 3, 4, 8, 10].includes(directIndex) ? 16 : 0;
  const badDirect = [6, 7, 11].includes(directIndex) ? -14 : 0;
  const goodStar = [0, 1, 4, 5, 7, 10].includes(dayBranch) ? 12 : 0;
  const lunarBonus = [1, 6, 8, 10, 15, 18, 22, 24, 28].includes(lunarDay) ? 10 : 0;
  const lunarPenalty = [3, 7, 13, 17, 23, 27, 29, 30].includes(lunarDay) ? -12 : 0;
  const rhythm = mod(jd * 37 + dayBranch * 11 + lunarDay * 7, 23) - 7;
  return Math.max(8, Math.min(96, 48 + goodDirect + badDirect + goodStar + lunarBonus + lunarPenalty + rhythm));
}

function classify(score: number) {
  if (score >= 72) return { label: "Ngày tốt", tone: "good" as FortuneTone, summary: "Phù hợp khởi sự nhẹ, gặp gỡ, ký việc nhỏ và sắp xếp kế hoạch quan trọng." };
  if (score >= 48) return { label: "Trung bình", tone: "neutral" as FortuneTone, summary: "Nên làm việc quen thuộc, kiểm tra kỹ điều khoản và tránh quyết định quá vội." };
  return { label: "Ngày xấu", tone: "bad" as FortuneTone, summary: "Ưu tiên giữ nhịp ổn định, hạn chế việc lớn và dành thời gian rà soát rủi ro." };
}

function recommendations(score: number, directIndex: number) {
  if (score >= 72) {
    return {
      good: ["Gặp gỡ đối tác", "Lập kế hoạch tài chính", "Khai bút, học tập", "Sắp xếp nhà cửa", "Bắt đầu thói quen mới"],
      avoid: ["Hứa quá mức", "Đầu tư cảm tính", "Tranh luận hơn thua"],
    };
  }
  if ([6, 7, 11].includes(directIndex)) {
    return {
      good: ["Dọn việc tồn", "Kiểm tra giấy tờ", "Nghỉ ngơi phục hồi", "Tổng kết kế hoạch"],
      avoid: ["Khai trương", "Ký hợp đồng lớn", "Xuất tiền lớn", "Chuyển việc vội"],
    };
  }
  return {
    good: ["Làm việc theo kế hoạch", "Trao đổi nội bộ", "Điều chỉnh lịch trình", "Chuẩn bị hồ sơ"],
    avoid: ["Mở rộng quá nhanh", "Quyết định khi thiếu dữ liệu", "Cam kết dài hạn"],
  };
}

export function analyzeDate(date: Date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const jd = jdFromDate(day, month, year);
  const lunar = solarToLunar(day, month, year, 7);
  const yearStem = mod(lunar.year - 4, 10);
  const yearBranch = mod(lunar.year - 4, 12);
  const monthStem = mod(yearStem * 2 + lunar.month + 1, 10);
  const monthBranch = mod(lunar.month + 1, 12);
  const dayStem = mod(jd + 9, 10);
  const dayBranch = mod(jd + 1, 12);
  const directIndex = mod(dayBranch - monthBranch, 12);
  const score = scoreDate(jd, dayBranch, lunar.day, directIndex);
  const status = classify(score);
  const recs = recommendations(score, directIndex);
  const goodHours = goodHourMap[dayBranch].map((index) => ({
    branch: branches[index],
    range: getHourRange(index),
  }));

  return {
    date,
    weekday: weekdays[date.getDay()],
    solar: { day, month, year },
    lunar,
    canChi: {
      year: canChi(yearStem, yearBranch),
      month: canChi(monthStem, monthBranch),
      day: canChi(dayStem, dayBranch),
    },
    dayBranchIndex: dayBranch,
    clash: branches[mod(dayBranch + 6, 12)],
    direct: directCycle[directIndex],
    star: dayStars[dayBranch],
    solarTerm: solarTerms[date.getMonth()],
    score,
    status,
    goodHours,
    goodThings: recs.good,
    avoidThings: recs.avoid,
  };
}

export function monthDays(year: number, month: number) {
  const total = new Date(year, month, 0).getDate();
  return Array.from({ length: total }, (_, index) => analyzeDate(new Date(`${year}-${pad(month)}-${pad(index + 1)}T12:00:00+07:00`)));
}
