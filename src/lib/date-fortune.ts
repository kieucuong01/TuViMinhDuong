import { jdFromDate, solarToLunar } from "@/lib/lunar";

export const stems = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const branches = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export type FortuneTone = "good" | "neutral" | "bad";
export type DateTaskKey = "general" | "wedding" | "opening" | "contract" | "travel" | "groundbreaking";

type RuleHit = {
  name: string;
  tone: FortuneTone;
  weight: number;
  summary: string;
  tasks?: DateTaskKey[];
  source: string;
};

type DateTaskRule = {
  key: DateTaskKey;
  label: string;
  description: string;
  goodDirects: string[];
  badDirects: string[];
  goodMansions: string[];
  badMansions: string[];
};

const SOURCE_NOTES = {
  lunar: "Âm lịch Việt Nam, Can Chi, ngày Julius theo thuật toán Hồ Ngọc Đức, múi giờ GMT+7.",
  officers: "12 trực: Trực Kiến khởi tại địa chi tháng, các ngày sau chạy vòng Kiến-Trừ-Mãn-Bình-Định-Chấp-Phá-Nguy-Thành-Thu-Khai-Bế.",
  zodiac: "Hoàng đạo/Hắc đạo: bảng 12 thần Thanh Long, Minh Đường, Thiên Hình... luân theo cặp tháng âm 1/7, 2/8, 3/9, 4/10, 5/11, 6/12.",
  mansions: "Nhị thập bát tú: chu kỳ 28 sao, đối chiếu mốc 20/05/2026 là sao Sâm Thủy Viên.",
  ngocHap: "Sao tốt/xấu Ngọc Hạp: dùng nhóm quy tắc phổ biến như Tam Nương, Nguyệt Kỵ, Dương Công Kỵ, Nguyệt Phá, Thiên Xá, Tam Hợp, Lục Hợp.",
};

const directCycle = [
  { name: "Kiến", tone: "neutral", weight: 2, goodFor: ["khởi sự vừa phải", "gặp gỡ"], avoidFor: ["việc quá lớn"] },
  { name: "Trừ", tone: "neutral", weight: 3, goodFor: ["dọn dẹp", "giải quyết việc cũ"], avoidFor: ["khai trương lớn"] },
  { name: "Mãn", tone: "good", weight: 10, goodFor: ["cầu tài", "tiệc mừng", "hoàn thiện"], avoidFor: ["kiện tụng"] },
  { name: "Bình", tone: "neutral", weight: 4, goodFor: ["việc thường ngày", "ổn định kế hoạch"], avoidFor: ["mạo hiểm"] },
  { name: "Định", tone: "good", weight: 12, goodFor: ["ký kết", "an vị", "cưới hỏi"], avoidFor: ["tranh chấp"] },
  { name: "Chấp", tone: "neutral", weight: 1, goodFor: ["giữ nề nếp", "bảo trì"], avoidFor: ["mở việc mới"] },
  { name: "Phá", tone: "bad", weight: -16, goodFor: ["phá bỏ việc xấu", "tháo dỡ"], avoidFor: ["cưới hỏi", "khai trương", "ký hợp đồng"] },
  { name: "Nguy", tone: "bad", weight: -10, goodFor: ["cảnh giác", "rà soát rủi ro"], avoidFor: ["xuất hành xa", "động thổ"] },
  { name: "Thành", tone: "good", weight: 15, goodFor: ["hoàn tất", "khai trương", "cưới hỏi", "ký kết"], avoidFor: ["việc cần phá bỏ"] },
  { name: "Thu", tone: "neutral", weight: 5, goodFor: ["thu hồi", "gom tiền", "tổng kết"], avoidFor: ["khai mở nhanh"] },
  { name: "Khai", tone: "good", weight: 14, goodFor: ["khai trương", "xuất hành", "mở dự án", "ký kết"], avoidFor: ["an táng"] },
  { name: "Bế", tone: "bad", weight: -12, goodFor: ["đóng việc", "tĩnh dưỡng"], avoidFor: ["mở việc mới", "cưới hỏi", "khai trương"] },
] as const;

const zodiacDeityCycle = [
  { name: "Thanh Long", tone: "good", meaning: "Hoàng đạo, lợi cho gặp gỡ, khai mở và việc cần sự hanh thông." },
  { name: "Minh Đường", tone: "good", meaning: "Hoàng đạo, hợp việc minh bạch, ký kết, trình bày, xin duyệt." },
  { name: "Thiên Hình", tone: "bad", meaning: "Hắc đạo, nên tránh việc pháp lý, tranh chấp, quyết định nóng." },
  { name: "Chu Tước", tone: "bad", meaning: "Hắc đạo, dễ sinh khẩu thiệt, giấy tờ cần kiểm tra kỹ." },
  { name: "Kim Quỹ", tone: "good", meaning: "Hoàng đạo, tốt cho tài chính, kho quỹ, giao dịch có chuẩn bị." },
  { name: "Kim Đường", tone: "good", meaning: "Hoàng đạo, lợi cho việc gia đạo, mua sắm, ký thỏa thuận." },
  { name: "Bạch Hổ", tone: "bad", meaning: "Hắc đạo, nên cẩn trọng sức khỏe, va chạm, việc nhiều áp lực." },
  { name: "Ngọc Đường", tone: "good", meaning: "Hoàng đạo, hợp cầu quý nhân, học hành, thủ tục trang trọng." },
  { name: "Thiên Lao", tone: "bad", meaning: "Hắc đạo, dễ bị ràng buộc, chậm tiến độ, nên tránh mở việc lớn." },
  { name: "Nguyên Vũ", tone: "bad", meaning: "Hắc đạo, cần giữ bí mật, tránh tin đồn, tránh quyết định mơ hồ." },
  { name: "Tư Mệnh", tone: "good", meaning: "Hoàng đạo, tốt cho sắp xếp, quản trị, việc cần trách nhiệm." },
  { name: "Câu Trần", tone: "bad", meaning: "Hắc đạo, dễ trì trệ, vướng mắc, nên xử lý tồn đọng." },
] as const;

const lunarMansions = [
  { name: "Giác", fullName: "Giác Mộc Giao", tone: "good", element: "Mộc", goodFor: ["khai trương", "học tập", "cầu danh"], avoidFor: ["việc thiếu chuẩn bị"], goodTasks: ["opening", "contract"], badTasks: [] },
  { name: "Cang", fullName: "Cang Kim Long", tone: "bad", element: "Kim", goodFor: ["rà soát", "kỷ luật"], avoidFor: ["cưới hỏi", "xây dựng"], goodTasks: [], badTasks: ["wedding", "groundbreaking"] },
  { name: "Đê", fullName: "Đê Thổ Lạc", tone: "bad", element: "Thổ", goodFor: ["việc nhỏ"], avoidFor: ["khởi sự", "ký kết lớn"], goodTasks: [], badTasks: ["opening", "contract"] },
  { name: "Phòng", fullName: "Phòng Nhật Thố", tone: "good", element: "Thái Dương", goodFor: ["cưới hỏi", "khai trương", "động thổ"], avoidFor: ["tranh chấp"], goodTasks: ["wedding", "opening", "groundbreaking"], badTasks: [] },
  { name: "Tâm", fullName: "Tâm Nguyệt Hồ", tone: "bad", element: "Thái Âm", goodFor: ["tĩnh tâm", "tu sửa nhỏ"], avoidFor: ["cưới hỏi", "đầu tư lớn"], goodTasks: [], badTasks: ["wedding", "opening"] },
  { name: "Vĩ", fullName: "Vĩ Hỏa Hổ", tone: "good", element: "Hỏa", goodFor: ["hoàn tất", "khai mở", "xuất hành"], avoidFor: ["cố chấp"], goodTasks: ["opening", "travel"], badTasks: [] },
  { name: "Cơ", fullName: "Cơ Thủy Báo", tone: "good", element: "Thủy", goodFor: ["lập kế hoạch", "đi xa", "giao thương"], avoidFor: ["vội vàng"], goodTasks: ["travel", "contract"], badTasks: [] },
  { name: "Đẩu", fullName: "Đẩu Mộc Giải", tone: "good", element: "Mộc", goodFor: ["tài chính", "khai trương", "thu hoạch"], avoidFor: ["kiện tụng"], goodTasks: ["opening", "contract"], badTasks: [] },
  { name: "Ngưu", fullName: "Ngưu Kim Ngưu", tone: "bad", element: "Kim", goodFor: ["chăn nuôi", "việc ổn định"], avoidFor: ["cưới hỏi", "khai trương"], goodTasks: [], badTasks: ["wedding", "opening"] },
  { name: "Nữ", fullName: "Nữ Thổ Bức", tone: "bad", element: "Thổ", goodFor: ["việc kín đáo"], avoidFor: ["cưới hỏi", "giao dịch lớn"], goodTasks: [], badTasks: ["wedding", "contract"] },
  { name: "Hư", fullName: "Hư Nhật Thử", tone: "bad", element: "Thái Dương", goodFor: ["nghỉ ngơi", "tổng kết"], avoidFor: ["khai trương", "động thổ"], goodTasks: [], badTasks: ["opening", "groundbreaking"] },
  { name: "Nguy", fullName: "Nguy Nguyệt Yến", tone: "bad", element: "Thái Âm", goodFor: ["phòng ngừa", "kiểm tra"], avoidFor: ["xuất hành xa", "động thổ"], goodTasks: [], badTasks: ["travel", "groundbreaking"] },
  { name: "Thất", fullName: "Thất Hỏa Trư", tone: "good", element: "Hỏa", goodFor: ["xây dựng", "an cư", "cưới hỏi"], avoidFor: ["đầu cơ"], goodTasks: ["wedding", "groundbreaking"], badTasks: [] },
  { name: "Bích", fullName: "Bích Thủy Du", tone: "good", element: "Thủy", goodFor: ["xây dựng", "cưới hỏi", "ký kết"], avoidFor: ["lười biếng"], goodTasks: ["wedding", "contract", "groundbreaking"], badTasks: [] },
  { name: "Khuê", fullName: "Khuê Mộc Lang", tone: "neutral", element: "Mộc", goodFor: ["học tập", "văn thư"], avoidFor: ["cưới hỏi gấp"], goodTasks: ["contract"], badTasks: ["wedding"] },
  { name: "Lâu", fullName: "Lâu Kim Cẩu", tone: "good", element: "Kim", goodFor: ["cưới hỏi", "khởi công", "mua bán"], avoidFor: ["tham nhanh"], goodTasks: ["wedding", "opening", "groundbreaking"], badTasks: [] },
  { name: "Vị", fullName: "Vị Thổ Trĩ", tone: "good", element: "Thổ", goodFor: ["khai trương", "cầu tài", "ký kết"], avoidFor: ["nóng vội"], goodTasks: ["opening", "contract"], badTasks: [] },
  { name: "Mão", fullName: "Mão Nhật Kê", tone: "bad", element: "Thái Dương", goodFor: ["dọn dẹp"], avoidFor: ["cưới hỏi", "khai trương"], goodTasks: [], badTasks: ["wedding", "opening"] },
  { name: "Tất", fullName: "Tất Nguyệt Ô", tone: "good", element: "Thái Âm", goodFor: ["cưới hỏi", "khai trương", "an táng"], avoidFor: ["kiện tụng"], goodTasks: ["wedding", "opening"], badTasks: [] },
  { name: "Chủy", fullName: "Chủy Hỏa Hầu", tone: "bad", element: "Hỏa", goodFor: ["học hỏi", "chỉnh sửa"], avoidFor: ["ký kết", "cưới hỏi"], goodTasks: [], badTasks: ["contract", "wedding"] },
  { name: "Sâm", fullName: "Sâm Thủy Viên", tone: "neutral", element: "Thủy", goodFor: ["tu sửa", "học tập", "chỉnh lý hồ sơ"], avoidFor: ["cưới hỏi vội", "an táng"], goodTasks: ["contract"], badTasks: ["wedding"] },
  { name: "Tỉnh", fullName: "Tỉnh Mộc Hãn", tone: "good", element: "Mộc", goodFor: ["khai thông", "đào tạo", "xuất hành"], avoidFor: ["mạo hiểm"], goodTasks: ["travel", "opening"], badTasks: [] },
  { name: "Quỷ", fullName: "Quỷ Kim Dương", tone: "bad", element: "Kim", goodFor: ["tế tự", "việc âm phần"], avoidFor: ["cưới hỏi", "khai trương"], goodTasks: [], badTasks: ["wedding", "opening"] },
  { name: "Liễu", fullName: "Liễu Thổ Chương", tone: "bad", element: "Thổ", goodFor: ["nghỉ ngơi"], avoidFor: ["giao dịch lớn", "xây dựng"], goodTasks: [], badTasks: ["contract", "groundbreaking"] },
  { name: "Tinh", fullName: "Tinh Nhật Mã", tone: "bad", element: "Thái Dương", goodFor: ["dọn việc", "kiểm tra"], avoidFor: ["cưới hỏi", "khai trương"], goodTasks: [], badTasks: ["wedding", "opening"] },
  { name: "Trương", fullName: "Trương Nguyệt Lộc", tone: "good", element: "Thái Âm", goodFor: ["cưới hỏi", "khai trương", "tiệc mừng"], avoidFor: ["tranh tụng"], goodTasks: ["wedding", "opening"], badTasks: [] },
  { name: "Dực", fullName: "Dực Hỏa Xà", tone: "bad", element: "Hỏa", goodFor: ["ẩn nhẫn", "học tập"], avoidFor: ["xuất hành", "động thổ"], goodTasks: [], badTasks: ["travel", "groundbreaking"] },
  { name: "Chẩn", fullName: "Chẩn Thủy Dẫn", tone: "good", element: "Thủy", goodFor: ["xuất hành", "khai mở", "ký kết"], avoidFor: ["nóng vội"], goodTasks: ["travel", "opening", "contract"], badTasks: [] },
] as const;

const taskRules: DateTaskRule[] = [
  { key: "general", label: "Tổng quát", description: "Nhịp chung của ngày cho việc thường nhật.", goodDirects: ["Mãn", "Định", "Thành", "Khai"], badDirects: ["Phá", "Nguy", "Bế"], goodMansions: [], badMansions: [] },
  { key: "wedding", label: "Cưới hỏi", description: "Ưu tiên ngày hòa hợp, tránh ngày xung tuổi và sát khí mạnh.", goodDirects: ["Mãn", "Định", "Thành"], badDirects: ["Phá", "Nguy", "Bế", "Trừ"], goodMansions: ["Phòng", "Thất", "Bích", "Lâu", "Tất", "Trương"], badMansions: ["Cang", "Tâm", "Ngưu", "Nữ", "Mão", "Chủy", "Quỷ", "Tinh"] },
  { key: "opening", label: "Khai trương", description: "Ưu tiên khai mở, tài khí, giao thương và ngày hoàng đạo.", goodDirects: ["Mãn", "Định", "Thành", "Khai"], badDirects: ["Phá", "Nguy", "Bế"], goodMansions: ["Giác", "Vĩ", "Đẩu", "Lâu", "Vị", "Tất", "Trương", "Chẩn"], badMansions: ["Đê", "Ngưu", "Hư", "Mão", "Quỷ", "Tinh"] },
  { key: "contract", label: "Ký hợp đồng", description: "Ưu tiên ngày sáng rõ, ổn định và ít sao khẩu thiệt.", goodDirects: ["Định", "Thành", "Khai", "Thu"], badDirects: ["Phá", "Nguy", "Bế"], goodMansions: ["Cơ", "Bích", "Khuê", "Vị", "Sâm", "Chẩn"], badMansions: ["Đê", "Nữ", "Chủy", "Liễu"] },
  { key: "travel", label: "Xuất hành", description: "Ưu tiên ngày thông suốt, tránh xung tuổi và sao nguy hiểm.", goodDirects: ["Thành", "Khai"], badDirects: ["Nguy", "Phá", "Bế"], goodMansions: ["Vĩ", "Cơ", "Tỉnh", "Chẩn"], badMansions: ["Nguy", "Dực"] },
  { key: "groundbreaking", label: "Động thổ", description: "Ưu tiên ngày xây dựng, tránh phá bế và các ngày kỵ động thổ.", goodDirects: ["Định", "Thành", "Khai"], badDirects: ["Phá", "Nguy", "Bế"], goodMansions: ["Phòng", "Thất", "Bích", "Lâu"], badMansions: ["Cang", "Hư", "Nguy", "Liễu", "Dực"] },
];

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

const solarTermBoundaries = [
  { month: 1, day: 5, name: "Tiểu Hàn" }, { month: 1, day: 20, name: "Đại Hàn" },
  { month: 2, day: 4, name: "Lập Xuân" }, { month: 2, day: 19, name: "Vũ Thủy" },
  { month: 3, day: 5, name: "Kinh Trập" }, { month: 3, day: 20, name: "Xuân Phân" },
  { month: 4, day: 4, name: "Thanh Minh" }, { month: 4, day: 20, name: "Cốc Vũ" },
  { month: 5, day: 5, name: "Lập Hạ" }, { month: 5, day: 21, name: "Tiểu Mãn" },
  { month: 6, day: 5, name: "Mang Chủng" }, { month: 6, day: 21, name: "Hạ Chí" },
  { month: 7, day: 7, name: "Tiểu Thử" }, { month: 7, day: 22, name: "Đại Thử" },
  { month: 8, day: 7, name: "Lập Thu" }, { month: 8, day: 23, name: "Xử Thử" },
  { month: 9, day: 7, name: "Bạch Lộ" }, { month: 9, day: 23, name: "Thu Phân" },
  { month: 10, day: 8, name: "Hàn Lộ" }, { month: 10, day: 23, name: "Sương Giáng" },
  { month: 11, day: 7, name: "Lập Đông" }, { month: 11, day: 22, name: "Tiểu Tuyết" },
  { month: 12, day: 7, name: "Đại Tuyết" }, { month: 12, day: 21, name: "Đông Chí" },
];

const branchTriads = [
  [8, 0, 4],
  [2, 6, 10],
  [11, 3, 7],
  [5, 9, 1],
];

const sixHarmonyPairs = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const sixClashPairs = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
const sixHarmPairs = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
const sixBreakPairs = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]];
const stemHarmonyPairs = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];
const stemClashPairs = [[0, 6], [1, 7], [2, 8], [3, 9]];

function mod(value: number, base: number) {
  return ((value % base) + base) % base;
}

function clamp(value: number, min = 8, max = 96) {
  return Math.max(min, Math.min(max, value));
}

function canChi(stemIndex: number, branchIndex: number) {
  return `${stems[mod(stemIndex, 10)]} ${branches[mod(branchIndex, 12)]}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function pairIncludes(pairs: number[][], a: number, b: number) {
  return pairs.some(([left, right]) => (left === a && right === b) || (left === b && right === a));
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

function getSolarTerm(month: number, day: number) {
  let term = "Đông Chí";
  for (const boundary of solarTermBoundaries) {
    if (month > boundary.month || (month === boundary.month && day >= boundary.day)) term = boundary.name;
  }
  return term;
}

function getZodiacDeity(lunarMonth: number, dayBranch: number) {
  const startBranch = mod((lunarMonth - 1) * 2, 12);
  const deity = zodiacDeityCycle[mod(dayBranch - startBranch, 12)];
  return {
    name: deity.name,
    tone: deity.tone as FortuneTone,
    type: deity.tone === "good" ? "Hoàng đạo" : "Hắc đạo",
    meaning: deity.meaning,
  };
}

function getLunarMansion(jd: number) {
  const anchorJd = jdFromDate(20, 5, 2026);
  const index = mod(jd - anchorJd + 20, 28);
  const mansion = lunarMansions[index];
  return { ...mansion, index: index + 1, tone: mansion.tone as FortuneTone };
}

function getNgocHapStars(lunarMonth: number, lunarDay: number, dayStem: number, dayBranch: number, monthBranch: number, directName: string) {
  const good: RuleHit[] = [];
  const bad: RuleHit[] = [];
  const dayCanChi = canChi(dayStem, dayBranch);
  const season = lunarMonth <= 3 ? "spring" : lunarMonth <= 6 ? "summer" : lunarMonth <= 9 ? "autumn" : "winter";

  if (
    (season === "spring" && dayCanChi === "Mậu Dần") ||
    (season === "summer" && dayCanChi === "Giáp Ngọ") ||
    (season === "autumn" && dayCanChi === "Mậu Thân") ||
    (season === "winter" && dayCanChi === "Giáp Tý")
  ) {
    good.push({
      name: "Thiên Xá",
      tone: "good",
      weight: 16,
      summary: "Ngày có khí giải ách, hợp cầu an, giải việc vướng mắc; riêng động thổ nên cân nhắc.",
      tasks: ["general", "contract"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  if (branchTriads.some((group) => group.includes(dayBranch) && group.includes(monthBranch))) {
    good.push({
      name: "Tam Hợp",
      tone: "good",
      weight: 8,
      summary: "Chi ngày cùng tam hợp với chi tháng, tăng tính hòa hợp và dễ phối hợp.",
      tasks: ["wedding", "opening", "contract"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  if (pairIncludes(sixHarmonyPairs, dayBranch, monthBranch)) {
    good.push({
      name: "Lục Hợp",
      tone: "good",
      weight: 8,
      summary: "Chi ngày lục hợp với chi tháng, lợi cho kết nối, thương lượng và quan hệ.",
      tasks: ["wedding", "contract"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  if ([3, 7, 13, 18, 22, 27].includes(lunarDay)) {
    bad.push({
      name: "Tam Nương",
      tone: "bad",
      weight: -18,
      summary: "Ngày dân gian thường kiêng khởi sự lớn, cưới hỏi, khai trương.",
      tasks: ["wedding", "opening", "groundbreaking"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  if ([5, 14, 23].includes(lunarDay)) {
    bad.push({
      name: "Nguyệt Kỵ",
      tone: "bad",
      weight: -14,
      summary: "Ngày cần giảm việc mạo hiểm, hạn chế khởi sự hoặc ký kết vội.",
      tasks: ["opening", "contract", "travel"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  const duongCongKy = new Set(["1-13", "2-11", "3-9", "4-7", "5-5", "6-3", "7-29", "8-27", "9-25", "10-23", "11-21", "12-19"]);
  if (duongCongKy.has(`${lunarMonth}-${lunarDay}`)) {
    bad.push({
      name: "Dương Công Kỵ",
      tone: "bad",
      weight: -16,
      summary: "Ngày kỵ theo hệ Dương Công, nên tránh việc lớn và giao dịch trọng yếu.",
      tasks: ["wedding", "opening", "contract", "groundbreaking"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  if (dayBranch === mod(monthBranch + 6, 12)) {
    bad.push({
      name: "Nguyệt Phá",
      tone: "bad",
      weight: -18,
      summary: "Chi ngày xung với chi tháng, dễ phá nhịp, kỵ khai mở lớn.",
      tasks: ["opening", "contract", "groundbreaking"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  if (directName === "Bế") {
    bad.push({
      name: "Thụ Tử",
      tone: "bad",
      weight: -10,
      summary: "Khí đóng, hợp kết thúc việc cũ hơn mở việc mới.",
      tasks: ["wedding", "opening", "travel"],
      source: SOURCE_NOTES.ngocHap,
    });
  }

  return { good, bad };
}

function analyzeAgeRelation(birthYear: number | undefined, dayStem: number, dayBranch: number) {
  if (!birthYear || birthYear < 1900 || birthYear > 2100) return null;
  const ageStem = mod(birthYear - 4, 10);
  const ageBranch = mod(birthYear - 4, 12);
  const notes: string[] = [];
  let score = 0;

  if (pairIncludes(stemHarmonyPairs, ageStem, dayStem)) {
    score += 6;
    notes.push(`Thiên can ${stems[ageStem]} hợp ${stems[dayStem]}`);
  }
  if (pairIncludes(stemClashPairs, ageStem, dayStem)) {
    score -= 6;
    notes.push(`Thiên can ${stems[ageStem]} xung ${stems[dayStem]}`);
  }
  if (branchTriads.some((group) => group.includes(ageBranch) && group.includes(dayBranch))) {
    score += 12;
    notes.push(`Địa chi ${branches[ageBranch]} tam hợp ${branches[dayBranch]}`);
  }
  if (pairIncludes(sixHarmonyPairs, ageBranch, dayBranch)) {
    score += 10;
    notes.push(`Địa chi ${branches[ageBranch]} lục hợp ${branches[dayBranch]}`);
  }
  if (pairIncludes(sixClashPairs, ageBranch, dayBranch)) {
    score -= 18;
    notes.push(`Địa chi ${branches[ageBranch]} lục xung ${branches[dayBranch]}`);
  }
  if (pairIncludes(sixHarmPairs, ageBranch, dayBranch)) {
    score -= 10;
    notes.push(`Địa chi ${branches[ageBranch]} tương hại ${branches[dayBranch]}`);
  }
  if (pairIncludes(sixBreakPairs, ageBranch, dayBranch)) {
    score -= 8;
    notes.push(`Địa chi ${branches[ageBranch]} tương phá ${branches[dayBranch]}`);
  }

  const tone: FortuneTone = score >= 10 ? "good" : score <= -10 ? "bad" : "neutral";
  return {
    birthYear,
    canChi: canChi(ageStem, ageBranch),
    stem: stems[ageStem],
    branch: branches[ageBranch],
    score,
    tone,
    notes: notes.length ? notes : ["Không có xung hợp mạnh với chi ngày"],
  };
}

function classify(score: number, goodCount: number, badCount: number) {
  if (score >= 72) return { label: "Ngày tốt", tone: "good" as FortuneTone, summary: `Có ${goodCount} điểm hỗ trợ nổi bật, phù hợp chọn việc có chuẩn bị và ưu tiên giờ hoàng đạo.` };
  if (score >= 48) return { label: "Trung bình", tone: "neutral" as FortuneTone, summary: `Cát hung đan xen: có ${goodCount} điểm tốt và ${badCount} điểm cần dè chừng, nên chọn việc vừa sức.` };
  return { label: "Ngày xấu", tone: "bad" as FortuneTone, summary: `Nhiều dấu hiệu bất lợi hơn thuận lợi, nên giảm việc lớn và chuyển trọng tâm sang rà soát rủi ro.` };
}

function taskScore(rule: DateTaskRule, directName: string, zodiacTone: FortuneTone, mansion: ReturnType<typeof getLunarMansion>, goodStars: RuleHit[], badStars: RuleHit[], age: ReturnType<typeof analyzeAgeRelation>) {
  let score = 50;
  const goodSignals: string[] = [];
  const badSignals: string[] = [];
  const mansionGoodTasks = mansion.goodTasks as readonly DateTaskKey[];
  const mansionBadTasks = mansion.badTasks as readonly DateTaskKey[];

  if (rule.goodDirects.includes(directName)) {
    score += 14;
    goodSignals.push(`Trực ${directName} hợp việc ${rule.label.toLowerCase()}`);
  }
  if (rule.badDirects.includes(directName)) {
    score -= 16;
    badSignals.push(`Trực ${directName} kỵ việc ${rule.label.toLowerCase()}`);
  }

  if (zodiacTone === "good") {
    score += 8;
    goodSignals.push("Ngày hoàng đạo");
  } else {
    score -= 8;
    badSignals.push("Ngày hắc đạo");
  }

  if (rule.goodMansions.includes(mansion.name) || mansionGoodTasks.includes(rule.key)) {
    score += 12;
    goodSignals.push(`Sao ${mansion.name} hỗ trợ`);
  }
  if (rule.badMansions.includes(mansion.name) || mansionBadTasks.includes(rule.key)) {
    score -= 12;
    badSignals.push(`Sao ${mansion.name} cần tránh`);
  }

  for (const star of goodStars) {
    if (!star.tasks || star.tasks.includes(rule.key) || rule.key === "general") {
      score += Math.min(10, star.weight);
      goodSignals.push(star.name);
    }
  }
  for (const star of badStars) {
    if (!star.tasks || star.tasks.includes(rule.key) || rule.key === "general") {
      score += Math.max(-18, star.weight);
      badSignals.push(star.name);
    }
  }

  if (age) {
    score += age.score;
    (age.score >= 0 ? goodSignals : badSignals).push(...age.notes);
  }

  const finalScore = clamp(score);
  const tone: FortuneTone = finalScore >= 72 ? "good" : finalScore >= 48 ? "neutral" : "bad";
  const verdict =
    tone === "good"
      ? "Có thể chọn nếu các điều kiện thực tế đã sẵn sàng."
      : tone === "neutral"
        ? "Dùng được cho việc vừa phải, nên chọn giờ tốt và kiểm tra kỹ."
        : "Nên cân nhắc đổi ngày hoặc giảm quy mô việc cần làm.";

  return {
    key: rule.key,
    label: rule.label,
    description: rule.description,
    score: finalScore,
    tone,
    verdict,
    goodSignals: goodSignals.slice(0, 5),
    badSignals: badSignals.slice(0, 5),
  };
}

function generalRecommendations(taskScores: ReturnType<typeof taskScore>[]) {
  const sortedGood = [...taskScores].sort((a, b) => b.score - a.score);
  const sortedBad = [...taskScores].sort((a, b) => a.score - b.score);
  return {
    good: sortedGood.filter((item) => item.score >= 52).slice(0, 5).map((item) => item.label),
    avoid: sortedBad.filter((item) => item.score < 52).slice(0, 5).map((item) => item.label),
  };
}

export function analyzeDate(date: Date, birthYear?: number) {
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
  const directInfo = directCycle[directIndex];
  const zodiac = getZodiacDeity(lunar.month, dayBranch);
  const mansion = getLunarMansion(jd);
  const stars = getNgocHapStars(lunar.month, lunar.day, dayStem, dayBranch, monthBranch, directInfo.name);
  const ageRelation = analyzeAgeRelation(birthYear, dayStem, dayBranch);
  const goodHours = goodHourMap[dayBranch].map((index) => ({
    branch: branches[index],
    range: getHourRange(index),
  }));
  const taskScores = taskRules.map((rule) => taskScore(rule, directInfo.name, zodiac.tone, mansion, stars.good, stars.bad, ageRelation));
  const recs = generalRecommendations(taskScores);
  const rawScore =
    50 +
    directInfo.weight +
    (zodiac.tone === "good" ? 12 : -10) +
    (mansion.tone === "good" ? 10 : mansion.tone === "bad" ? -10 : 0) +
    stars.good.reduce((total, star) => total + star.weight, 0) +
    stars.bad.reduce((total, star) => total + star.weight, 0) +
    (ageRelation?.score || 0);
  const score = clamp(rawScore);
  const status = classify(score, stars.good.length + (zodiac.tone === "good" ? 1 : 0), stars.bad.length + (zodiac.tone === "bad" ? 1 : 0));

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
    indices: {
      dayStem,
      dayBranch,
      monthBranch,
      yearStem,
      yearBranch,
    },
    dayBranchIndex: dayBranch,
    clash: branches[mod(dayBranch + 6, 12)],
    direct: directInfo.name,
    directInfo: { ...directInfo, tone: directInfo.tone as FortuneTone, source: SOURCE_NOTES.officers },
    star: zodiac.name,
    zodiac,
    mansion,
    solarTerm: getSolarTerm(month, day),
    score,
    status,
    goodHours,
    goodThings: recs.good.length ? recs.good : ["Việc thường ngày", "Sắp xếp kế hoạch"],
    avoidThings: recs.avoid.length ? recs.avoid : ["Quyết định nóng", "Việc thiếu dữ liệu"],
    goodStars: stars.good,
    badStars: stars.bad,
    ageRelation,
    taskScores,
    sources: SOURCE_NOTES,
  };
}

export function monthDays(year: number, month: number) {
  const total = new Date(year, month, 0).getDate();
  return Array.from({ length: total }, (_, index) => analyzeDate(new Date(`${year}-${pad(month)}-${pad(index + 1)}T12:00:00+07:00`)));
}
