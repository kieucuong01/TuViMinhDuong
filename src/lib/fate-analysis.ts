import { analyzeDate, formatDate, monthDays, toInputDate } from "@/lib/date-fortune";
import type { TuViChart } from "@/lib/chart";

export type FateReadingKind = "major" | "minor" | "monthly" | "daily";

export type FateReadingItem = {
  kind: FateReadingKind;
  title: string;
  scopeKey: string;
  type: "DAI_VAN" | "TIEU_VAN" | "NGUYET_VAN" | "NHAT_VAN";
  label: string;
  range?: string;
  palace?: string;
  branch?: string;
  isCurrent?: boolean;
  good: number;
  challenge: number;
  summary: string;
  evidence: string[];
  advice: string[];
};

function clamp(value: number) {
  return Math.max(12, Math.min(96, Math.round(value)));
}

function pseudoScore(seed: number, offset = 0) {
  return clamp(24 + Math.abs(Math.sin(seed * 1.73 + offset) * 68));
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function dateInBangkok(year: number, month: number, day: number) {
  return new Date(`${year}-${pad(month)}-${pad(day)}T12:00:00+07:00`);
}

function chartAge(chart: TuViChart, year = chart.input.viewYear) {
  return Math.max(1, year - (chart.solar?.year || chart.input.year));
}

function palaceForPeriod(chart: TuViChart, palaceName?: string) {
  return chart.palaces.find((palace) => palace.name === palaceName);
}

function listStars(stars: string[], fallback = "không nổi bật", limit = 4) {
  if (!stars.length) return fallback;
  const visible = stars.slice(0, limit);
  const rest = stars.length - visible.length;
  return rest > 0 ? `${visible.join(", ")} + ${rest} sao khác` : visible.join(", ");
}

function periodTheme(good: number, challenge: number) {
  if (good - challenge >= 18) return "Giai đoạn thuận để mở rộng có chọn lọc";
  if (challenge - good >= 18) return "Giai đoạn nên giữ nhịp và quản trị rủi ro";
  return "Giai đoạn cân bằng, hợp củng cố nền tảng";
}

export function getMajorFateItems(chart: TuViChart): FateReadingItem[] {
  const age = chartAge(chart);
  return chart.daiVan.slice(0, 10).map((period, index) => {
    const [start, end] = period.range.split("-").map(Number);
    const palace = palaceForPeriod(chart, period.palace);
    const good = pseudoScore(index + chart.lunar.day, palace?.mainStars.length || 0);
    const challenge = pseudoScore(index + chart.lunar.month, palace?.supportStars.length || 2.5);
    const isCurrent = age >= start && age <= end;
    return {
      kind: "major",
      type: "DAI_VAN",
      title: `Đại vận ${period.range} tuổi`,
      label: period.range,
      scopeKey: period.range,
      range: `${chart.solar.year + start}-${chart.solar.year + end}`,
      palace: period.palace,
      branch: period.branch,
      isCurrent,
      good,
      challenge,
      summary: `${periodTheme(good, challenge)}. Đại vận này đi qua cung ${period.palace}, nên đọc cùng Mệnh, Thân và Quan Lộc để hiểu hướng 10 năm.`,
      evidence: [
        `Cung đại vận: ${period.palace} tại ${period.branch}`,
        `Chính tinh: ${listStars(palace?.mainStars || [], "vô chính diệu")}`,
        `Phụ tinh: ${listStars(palace?.supportStars || [])}`,
        `Sao lưu năm: ${listStars(palace?.yearlyStars || [])}`,
      ],
      advice: [
        "Chọn một trọng tâm lớn cho cả giai đoạn, tránh đổi hướng liên tục.",
        "Việc quan trọng nên có kế hoạch dự phòng và mốc kiểm tra hằng năm.",
        challenge > good ? "Khi áp lực tăng, ưu tiên giữ sức khỏe và dòng tiền trước khi mở rộng." : "Có thể mở rộng nếu nền tảng, người hỗ trợ và dữ liệu đã đủ rõ.",
      ],
    };
  });
}

export function getMinorFateItems(chart: TuViChart): FateReadingItem[] {
  const startYear = chart.input.viewYear - 3;
  return Array.from({ length: 9 }, (_, index) => {
    const year = startYear + index;
    const age = chartAge(chart, year);
    const major = chart.daiVan.find((period) => {
      const [start, end] = period.range.split("-").map(Number);
      return age >= start && age <= end;
    });
    const palace = palaceForPeriod(chart, major?.palace);
    const good = pseudoScore(year + chart.lunar.day, index);
    const challenge = pseudoScore(year + chart.lunar.month, index + 2);
    const isCurrent = year === chart.input.viewYear;
    return {
      kind: "minor",
      type: "TIEU_VAN",
      title: `Tiểu vận năm ${year}`,
      label: String(year),
      scopeKey: `tieu-${year}`,
      range: `${age} tuổi`,
      palace: major?.palace,
      branch: major?.branch,
      isCurrent,
      good,
      challenge,
      summary: isCurrent
        ? `Đây là năm đang xem, nằm trong nền đại vận ${major?.range || "hiện tại"}. Nên ưu tiên quyết định có kiểm chứng và giữ nhịp ổn định.`
        : `Năm ${year} là lớp vận từng năm để nhìn cơ hội, áp lực và việc nên chuẩn bị từ sớm.`,
      evidence: [
        `Tuổi năm ${year}: ${age}`,
        `Nền đại vận: ${major ? `${major.range} tuổi tại cung ${major.palace}` : "chưa xác định"}`,
        `Chính tinh cung nền: ${listStars(palace?.mainStars || [], "vô chính diệu")}`,
        `Sao lưu liên quan: ${listStars(palace?.yearlyStars || [])}`,
      ],
      advice: [
        good >= challenge ? "Nên tận dụng năm này cho việc đã chuẩn bị kỹ." : "Nên đi chậm, kiểm tra giấy tờ, tiền bạc và sức khỏe.",
        "Không nên xem một năm riêng lẻ tách khỏi đại vận 10 năm.",
        "Mỗi quý nên rà lại mục tiêu, tài chính và quan hệ quan trọng.",
      ],
    };
  });
}

const monthNames = ["Tháng Giêng", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Chạp"];

export function getMonthlyFateItems(chart: TuViChart): FateReadingItem[] {
  return monthNames.map((name, index) => {
    const start = dateInBangkok(chart.input.viewYear, index + 1, 17);
    const end = dateInBangkok(index === 11 ? chart.input.viewYear + 1 : chart.input.viewYear, index === 11 ? 1 : index + 2, 16);
    const dateInfo = analyzeDate(start, chart.solar.year);
    const good = pseudoScore(index + chart.lunar.day, dateInfo.score / 10);
    const challenge = pseudoScore(index + chart.lunar.month, 4);
    return {
      kind: "monthly",
      type: "NGUYET_VAN",
      title: `${name} năm ${chart.input.viewYear}`,
      label: name,
      scopeKey: `${chart.input.viewYear}-${pad(index + 1)}`,
      range: `${formatDate(start)} - ${formatDate(end)}`,
      isCurrent: new Date().getMonth() === index && new Date().getFullYear() === chart.input.viewYear,
      good,
      challenge,
      summary: good >= challenge ? "Tháng này có nhiều tín hiệu thuận để làm việc đã chuẩn bị." : "Tháng này nên giữ nhịp, hạn chế quyết định vội và tránh ôm quá nhiều việc.",
      evidence: [
        `Khoảng dương lịch tham khảo: ${formatDate(start)} - ${formatDate(end)}`,
        `Ngày đầu tháng tham chiếu: ${dateInfo.canChi.day}, trực ${dateInfo.direct}`,
        `Sao ngày tham chiếu: ${dateInfo.mansion.name}, ${dateInfo.zodiac.type}`,
        `Nền năm xem: ${chart.input.viewYear}, tuổi ${chartAge(chart)}`,
      ],
      advice: [
        "Chọn 1 việc chính trong tháng, tránh dàn trải.",
        "Đầu tháng nên rà lại lịch, tiền bạc và sức khỏe.",
        good >= challenge ? "Có thể đẩy việc quan trọng nếu điều kiện thực tế đã sẵn." : "Việc lớn nên chia nhỏ, chọn ngày/giờ kỹ hơn.",
      ],
    };
  });
}

export function getDailyFateItem(chart: TuViChart, date = new Date()): FateReadingItem & { date: Date; dateInput: string; dateScore: number; goodHours: string[] } {
  const selected = analyzeDate(dateInBangkok(chart.input.viewYear, date.getMonth() + 1, date.getDate()), chart.solar.year);
  const palace = chart.palaces.find((item) => item.isMenh) || chart.palaces[0];
  const personalBonus = palace?.yearlyStars?.length ? 4 : 0;
  const good = clamp(selected.score + personalBonus);
  const challenge = clamp(100 - selected.score * 0.72);
  return {
    kind: "daily",
    type: "NHAT_VAN",
    title: `Nhật vận ngày ${formatDate(selected.date)}`,
    label: formatDate(selected.date),
    scopeKey: toInputDate(selected.date),
    range: selected.weekday,
    isCurrent: true,
    good,
    challenge,
    date: selected.date,
    dateInput: toInputDate(selected.date),
    dateScore: selected.score,
    goodHours: selected.goodHours.slice(0, 6).map((hour) => `${hour.branch} (${hour.range})`),
    summary: `${selected.status.label}: ${selected.status.summary} Khi cá nhân hóa theo lá số, nên đọc thêm Mệnh, Thân và vận năm trước khi chọn việc lớn.`,
    evidence: [
      `Can chi ngày: ${selected.canChi.day}`,
      `12 trực: ${selected.direct}; ${selected.zodiac.type}: ${selected.zodiac.name}`,
      `Nhị thập bát tú: ${selected.mansion.name}`,
      `Tuổi/năm sinh: ${chart.canChi.year}; quan hệ tuổi-ngày: ${selected.ageRelation?.notes.join(", ") || "không có xung hợp mạnh"}`,
    ],
    advice: [
      selected.goodThings.length ? `Việc có thể ưu tiên: ${selected.goodThings.slice(0, 3).join(", ")}.` : "Ưu tiên việc thường ngày, có chuẩn bị.",
      selected.avoidThings.length ? `Việc nên tránh: ${selected.avoidThings.slice(0, 3).join(", ")}.` : "Tránh quyết định vội.",
      `Giờ tốt tham khảo: ${selected.goodHours.slice(0, 3).map((hour) => `${hour.branch} ${hour.range}`).join(", ")}.`,
    ],
  };
}

export function getDailyMonthTrend(chart: TuViChart, date = new Date()) {
  const selected = analyzeDate(dateInBangkok(chart.input.viewYear, date.getMonth() + 1, date.getDate()), chart.solar.year);
  return monthDays(selected.solar.year, selected.solar.month).map((day) => ({
    label: String(day.solar.day),
    good: day.score,
    challenge: 100 - day.score * 0.72,
  }));
}
