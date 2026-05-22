import type { TuViChart } from "@/lib/chart";

export const PALACE_READING_ORDER = [
  "Mệnh",
  "Tài Bạch",
  "Quan Lộc",
  "Phụ Mẫu",
  "Phúc Đức",
  "Nô Bộc",
  "Thiên Di",
  "Huynh Đệ",
  "Điền Trạch",
  "Tử Tức",
  "Phu Thê",
  "Tật Ách",
] as const;

const GOOD_STAR_HINTS = ["Lộc", "Khoa", "Quyền", "Tả", "Hữu", "Xương", "Khúc", "Khôi", "Việt", "Long", "Phượng", "Ân", "Quang", "Thai", "Tọa"];
const RISK_STAR_HINTS = ["Kình", "Đà", "Không", "Kiếp", "Hỏa", "Linh", "Tang", "Hổ", "Khốc", "Hư", "Kỵ", "Riêu", "La", "Võng", "Hao", "Sát"];
const CORE_PALACES = new Set(["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"]);

export type PalaceReadingItem = {
  palace: TuViChart["palaces"][number];
  title: string;
  score: number;
  level: "Thuận lợi" | "Cân bằng" | "Cần lưu ý";
  summary: string;
  evidence: string[];
  strengths: string[];
  cautions: string[];
};

function clamp(value: number) {
  return Math.max(12, Math.min(96, Math.round(value)));
}

function scoreStar(star: string, state?: string) {
  let score = 0;
  if (state === "M") score += 12;
  if (state === "V") score += 10;
  if (state === "Đ") score += 8;
  if (state === "B") score += 1;
  if (state === "H") score -= 10;
  if (GOOD_STAR_HINTS.some((hint) => star.includes(hint))) score += 4;
  if (RISK_STAR_HINTS.some((hint) => star.includes(hint))) score -= 5;
  if (star.startsWith("L.") && RISK_STAR_HINTS.some((hint) => star.includes(hint))) score -= 4;
  if (star.startsWith("L.") && GOOD_STAR_HINTS.some((hint) => star.includes(hint))) score += 3;
  if (star === "Triệt" || star === "Tuần") score -= 4;
  return score;
}

function starWithState(palace: PalaceReadingItem["palace"], star: string) {
  const state = palace.starStates?.[star];
  return state ? `${star} (${state})` : star;
}

function listStars(palace: PalaceReadingItem["palace"], stars: string[], fallback: string, limit = 5) {
  if (!stars.length) return fallback;
  const visible = stars.slice(0, limit).map((star) => starWithState(palace, star));
  const rest = stars.length - visible.length;
  return rest > 0 ? `${visible.join(", ")} + ${rest} sao khác` : visible.join(", ");
}

function palaceTitle(palace: PalaceReadingItem["palace"]) {
  if (palace.name === "Mệnh") return palace.isThan ? "Cung Mệnh + Thân" : "Cung Mệnh";
  return palace.isThan ? `Cung ${palace.name} + Thân` : `Cung ${palace.name}`;
}

function palaceLevel(score: number): PalaceReadingItem["level"] {
  if (score >= 68) return "Thuận lợi";
  if (score >= 48) return "Cân bằng";
  return "Cần lưu ý";
}

function buildSummary(palace: PalaceReadingItem["palace"], score: number) {
  const level = palaceLevel(score);
  const main = listStars(palace, palace.mainStars, "vô chính diệu", 2);
  if (level === "Thuận lợi") {
    return `${palaceTitle(palace)} có ${main}, là vùng có nhiều tín hiệu để chủ động phát huy. Nên dùng điểm này như lợi thế, nhưng vẫn đọc cùng Mệnh, Thân và vận hiện tại.`;
  }
  if (level === "Cần lưu ý") {
    return `${palaceTitle(palace)} có ${main}, đi kèm vài tín hiệu cần quản trị thận trọng. Đây không phải kết luận xấu, mà là lời nhắc nên đi chậm và kiểm tra kỹ hơn.`;
  }
  return `${palaceTitle(palace)} có ${main}, xu hướng khá cân bằng. Phần thuận lợi và phần cần lưu ý nên được đặt vào đúng hoàn cảnh đời sống hiện tại.`;
}

function buildStrengths(palace: PalaceReadingItem["palace"]) {
  const strengths = palace.supportStars
    .filter((star) => GOOD_STAR_HINTS.some((hint) => star.includes(hint)))
    .slice(0, 3)
    .map((star) => `${starWithState(palace, star)} hỗ trợ khả năng mở rộng, được giúp đỡ hoặc xử lý việc thuận hơn.`);
  if (palace.mainStars.some((star) => star !== "Vô chính diệu")) {
    strengths.unshift(`Chính tinh ${listStars(palace, palace.mainStars, "vô chính diệu", 3)} là trục chính để đọc cung này.`);
  }
  return strengths.length ? strengths.slice(0, 3) : ["Cung này nên đọc như vùng cần quan sát thêm, chưa nên kết luận chỉ từ một sao riêng lẻ."];
}

function buildCautions(palace: PalaceReadingItem["palace"]) {
  const riskStars = [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars]
    .filter((star) => palace.starStates?.[star] === "H" || RISK_STAR_HINTS.some((hint) => star.includes(hint)))
    .slice(0, 3)
    .map((star) => `${starWithState(palace, star)} nên được hiểu là tín hiệu quản trị rủi ro, không phải điều chắc chắn xảy ra.`);
  return riskStars.length ? riskStars : ["Không có tín hiệu căng nổi bật trong phần preview; vẫn nên đọc chi tiết trước khi quyết định việc lớn."];
}

export function getPalaceReadingItems(chart: TuViChart): PalaceReadingItem[] {
  return PALACE_READING_ORDER.map((name) => chart.palaces.find((palace) => palace.name === name))
    .filter((palace): palace is TuViChart["palaces"][number] => Boolean(palace))
    .map((palace) => {
      const stars = [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars];
      const rawScore = stars.reduce((total, star) => total + scoreStar(star, palace.starStates?.[star]), 52);
      const score = clamp(rawScore + (CORE_PALACES.has(palace.name) ? 3 : 0) + (palace.isMenh ? 4 : 0) + (palace.isThan ? 4 : 0));
      return {
        palace,
        title: palaceTitle(palace),
        score,
        level: palaceLevel(score),
        summary: buildSummary(palace, score),
        evidence: [
          `Chính tinh: ${listStars(palace, palace.mainStars, "vô chính diệu")}`,
          `Phụ tinh: ${listStars(palace, palace.supportStars, "không nổi bật", 7)}`,
          `Sao lưu năm: ${listStars(palace, palace.yearlyStars, "không nổi bật", 5)}`,
          `Vòng trường sinh: ${palace.lifecycle}; đại vận cung: ${palace.ageRange} tuổi`,
        ],
        strengths: buildStrengths(palace),
        cautions: buildCautions(palace),
      };
    });
}

