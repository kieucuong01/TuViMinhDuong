type LifetimeGender = "nam mạng" | "nữ mạng";
type ElementName = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";

export type HistoricalLifetimeArticleInput = {
  slug: string;
  title: string;
  year: string;
  canChi: string;
  gender: LifetimeGender;
  napAm: string;
  cungPhi: string;
  animalSymbol: string;
  compatibility: string;
  riskAges: string;
  fengShui: string;
  quickFocus: string;
  summary: string;
  personality: string;
  work: string;
  money: string;
  family: string;
  health: string;
  stages: [string, string][];
  advice: string;
  siblingLink?: { href: string; label: string };
};

export type HistoricalLifetimeCard = {
  id: string;
  detailsPath: string;
  title: string;
  year: string;
  canChi: string;
  gender: "Nam mạng" | "Nữ mạng";
  overview: string;
  work: string;
  family: string;
  caution: string;
};

type YearRow = {
  year: number;
  canChi: string;
  slugCanChi: string;
  napAm: string;
  element: ElementName;
  can: string;
  chi: string;
};

const years: YearRow[] = [
  [1940, "Canh Thìn", "canh-thin", "Bạch Lạp Kim", "Kim", "Canh", "Thìn"],
  [1941, "Tân Tỵ", "tan-ty", "Bạch Lạp Kim", "Kim", "Tân", "Tỵ"],
  [1942, "Nhâm Ngọ", "nham-ngo", "Dương Liễu Mộc", "Mộc", "Nhâm", "Ngọ"],
  [1943, "Quý Mùi", "quy-mui", "Dương Liễu Mộc", "Mộc", "Quý", "Mùi"],
  [1944, "Giáp Thân", "giap-than", "Tuyền Trung Thủy", "Thủy", "Giáp", "Thân"],
  [1945, "Ất Dậu", "at-dau", "Tuyền Trung Thủy", "Thủy", "Ất", "Dậu"],
  [1946, "Bính Tuất", "binh-tuat", "Ốc Thượng Thổ", "Thổ", "Bính", "Tuất"],
  [1947, "Đinh Hợi", "dinh-hoi", "Ốc Thượng Thổ", "Thổ", "Đinh", "Hợi"],
  [1948, "Mậu Tý", "mau-ty", "Tích Lịch Hỏa", "Hỏa", "Mậu", "Tý"],
  [1949, "Kỷ Sửu", "ky-suu", "Tích Lịch Hỏa", "Hỏa", "Kỷ", "Sửu"],
  [1950, "Canh Dần", "canh-dan", "Tùng Bách Mộc", "Mộc", "Canh", "Dần"],
  [1951, "Tân Mão", "tan-mao", "Tùng Bách Mộc", "Mộc", "Tân", "Mão"],
  [1952, "Nhâm Thìn", "nham-thin", "Trường Lưu Thủy", "Thủy", "Nhâm", "Thìn"],
  [1953, "Quý Tỵ", "quy-ty", "Trường Lưu Thủy", "Thủy", "Quý", "Tỵ"],
  [1954, "Giáp Ngọ", "giap-ngo", "Sa Trung Kim", "Kim", "Giáp", "Ngọ"],
  [1955, "Ất Mùi", "at-mui", "Sa Trung Kim", "Kim", "Ất", "Mùi"],
  [1956, "Bính Thân", "binh-than", "Sơn Hạ Hỏa", "Hỏa", "Bính", "Thân"],
  [1957, "Đinh Dậu", "dinh-dau", "Sơn Hạ Hỏa", "Hỏa", "Đinh", "Dậu"],
  [1958, "Mậu Tuất", "mau-tuat", "Bình Địa Mộc", "Mộc", "Mậu", "Tuất"],
  [1959, "Kỷ Hợi", "ky-hoi", "Bình Địa Mộc", "Mộc", "Kỷ", "Hợi"],
  [1960, "Canh Tý", "canh-ty", "Bích Thượng Thổ", "Thổ", "Canh", "Tý"],
].map(([year, canChi, slugCanChi, napAm, element, can, chi]) => ({ year, canChi, slugCanChi, napAm, element, can, chi }) as YearRow);

const canElements: Record<string, ElementName> = {
  Giáp: "Mộc",
  "Ất": "Mộc",
  Bính: "Hỏa",
  Đinh: "Hỏa",
  Mậu: "Thổ",
  Kỷ: "Thổ",
  Canh: "Kim",
  Tân: "Kim",
  Nhâm: "Thủy",
  Quý: "Thủy",
};

const chiElements: Record<string, ElementName> = {
  Tý: "Thủy",
  Sửu: "Thổ",
  Dần: "Mộc",
  Mão: "Mộc",
  Thìn: "Thổ",
  "Tỵ": "Hỏa",
  Ngọ: "Hỏa",
  Mùi: "Thổ",
  Thân: "Kim",
  Dậu: "Kim",
  Tuất: "Thổ",
  Hợi: "Thủy",
};

const animalNames: Record<string, string> = {
  Tý: "Chuột",
  Sửu: "Trâu",
  Dần: "Hổ",
  Mão: "Mèo",
  Thìn: "Rồng",
  "Tỵ": "Rắn",
  Ngọ: "Ngựa",
  Mùi: "Dê",
  Thân: "Khỉ",
  Dậu: "Gà",
  Tuất: "Chó",
  Hợi: "Heo",
};

const elementNotes: Record<ElementName, string> = {
  Kim: "trọng chuẩn mực, giấy tờ, uy tín và sự rõ ràng; khi lệch dễ cứng lời hoặc giữ tiêu chuẩn cao quá mức",
  Mộc: "coi trọng quan hệ, sự nâng đỡ và đường dài; khi lệch dễ ôm việc, nể tình hoặc lo cho người khác quá phần",
  Thủy: "linh hoạt, biết nghe tình thế và xoay chuyển; khi lệch dễ lo âm, mềm lòng hoặc để cảm xúc kéo dài",
  Hỏa: "có sức bật, nhiệt tình và quyết nhanh; khi lệch dễ nóng, vội hoặc chi tiền theo cảm hứng",
  Thổ: "cần nền ổn định, trách nhiệm và tài sản rõ; khi lệch dễ gánh nặng, chậm buông và tự chịu quá lâu",
};

const palaceMap: Record<number, string> = {
  1: "Khảm Thủy, Đông tứ mệnh",
  2: "Khôn Thổ, Tây tứ mệnh",
  3: "Chấn Mộc, Đông tứ mệnh",
  4: "Tốn Mộc, Đông tứ mệnh",
  6: "Càn Kim, Tây tứ mệnh",
  7: "Đoài Kim, Tây tứ mệnh",
  8: "Cấn Thổ, Tây tứ mệnh",
  9: "Ly Hỏa, Đông tứ mệnh",
};

function digitRoot(value: number): number {
  return value <= 9 ? value : digitRoot(String(value).split("").reduce((sum, digit) => sum + Number(digit), 0));
}

function cungPhi(year: number, gender: LifetimeGender) {
  const lastTwo = year % 100;
  const base = digitRoot(Math.floor(lastTwo / 10) + (lastTwo % 10));
  let palace = gender === "nam mạng" ? 10 - base : digitRoot(5 + base);
  if (palace === 0) palace = 9;
  if (palace === 5) palace = gender === "nam mạng" ? 2 : 8;
  return palaceMap[palace];
}

function slugFor(row: YearRow, gender: LifetimeGender) {
  return `tu-vi-tron-doi-tuoi-${row.slugCanChi}-${row.year}-${gender === "nam mạng" ? "nam-mang" : "nu-mang"}`;
}

function buildArticle(row: YearRow, gender: LifetimeGender): HistoricalLifetimeArticleInput {
  const slug = slugFor(row, gender);
  const otherGender = gender === "nam mạng" ? "nữ mạng" : "nam mạng";
  const title = `Tử vi trọn đời tuổi ${row.canChi} ${row.year} ${gender}`;
  const role =
    gender === "nam mạng"
      ? "vai trò trụ cột, cố vấn, người giữ nguyên tắc và người chuyển giao kinh nghiệm"
      : "vai trò quán xuyến, giữ nếp nhà, nối cảm xúc gia đình và chăm sự ổn định hậu vận";

  return {
    slug,
    title,
    year: String(row.year),
    canChi: row.canChi,
    gender,
    napAm: row.napAm,
    cungPhi: cungPhi(row.year, gender),
    animalSymbol: `${animalNames[row.chi]}, thiên can ${row.can} thuộc ${canElements[row.can]}, địa chi ${row.chi} thuộc ${chiElements[row.chi]}`,
    compatibility: `nạp âm ${row.napAm} thuộc ${row.element}, ${elementNotes[row.element]}. Khi xét hợp kỵ cho ${row.canChi} ${gender}, nên đặt thêm cung phi ${cungPhi(row.year, gender)}, sức khỏe hiện tại, người sống chung, giấy tờ tài sản và trách nhiệm gia đình; không nên biến hợp tuổi thành lý do loại bỏ người hay cơ hội khi dữ kiện thực tế chưa rõ.`,
    riskAges: `Với ${row.canChi} ${gender}, các mốc sau 60 tuổi như sửa nhà, chia tài sản, bảo lãnh, chuyển nơi ở, chăm bệnh, lo con cháu hoặc góp vốn nên chậm một nhịp để kiểm dòng tiền, pháp lý và sức khỏe. Năm có tang chế, bệnh kéo dài hoặc áp lực họ hàng càng cần giảm quyết định cảm tính.`,
    fengShui: `${row.canChi} ${gender} nên dùng phong thủy theo hướng thực dụng: phòng sáng, lối đi thoáng, thuốc men - giấy tờ - tài sản đặt nơi dễ tìm, màu hợp ${row.element} chỉ dùng vừa đủ để tạo cảm giác ổn định. Vật phẩm không thay thế bác sĩ, luật sư, hợp đồng hay cuộc nói chuyện cần thiết trong nhà.`,
    quickFocus: `${row.napAm} thuộc ${row.element}; ưu tiên sức khỏe, giấy tờ, tài sản, ranh giới trách nhiệm và cách truyền kinh nghiệm cho con cháu.`,
    summary: `${row.canChi} ${row.year} ${gender} hiện thuộc nhóm hậu vận, nên bài đọc cần tập trung vào cách giữ sức, giữ tiền, giữ hòa khí và sắp xếp vai trò trong gia đình. Nền ${row.napAm} cho thấy người tuổi này ${elementNotes[row.element]}. Khi tách riêng ${gender}, trọng tâm nằm ở ${role}. Đây không phải bài phán số cố định, mà là khung để nhìn rõ điều nên giữ, điều nên buông và quyết định nào cần đối chiếu bằng lá số cá nhân.`,
    personality: `${row.canChi} ${gender} có thiên can ${row.can} và địa chi ${row.chi}, vì vậy tính cách không chỉ đọc theo con giáp. Người tuổi này thường đã trải qua đủ trách nhiệm để có kinh nghiệm riêng, nhưng cũng dễ quen với cách tự xử lý mọi việc. Điểm mạnh là biết nhìn xa, giữ lời và có sức chịu đựng; điểm cần sửa là nói nhu cầu sớm hơn, nghe phản hồi chậm hơn và không dùng kinh nghiệm cũ để kiểm soát đời sống của con cháu.`,
    work: `Ở giai đoạn hiện tại, công việc của ${row.canChi} ${gender} nên hiểu rộng: cố vấn, quản lý tài sản, hỗ trợ kinh doanh gia đình, giữ vai trò trong họ hàng, làm nhẹ theo kinh nghiệm hoặc truyền nghề. Nền ${row.napAm} hợp việc có trật tự, người kế nhiệm rõ và rủi ro được ghi ra trước. Không nên nhận thêm việc chỉ vì ngại từ chối, sĩ diện hoặc sợ người khác nghĩ mình hết vai trò.`,
    money: `Tài chính của ${row.canChi} ${gender} cần tách tiền sinh hoạt, quỹ y tế, tài sản tích lũy và khoản hỗ trợ con cháu. Rủi ro lớn thường không phải thiếu cơ hội mà là cho vay vì nể, đứng tên hộ, bảo lãnh, góp vốn không hợp đồng hoặc chia tài sản khi chưa thống nhất. Tử vi ở đây chỉ nhắc cách quản trị rủi ro, không hứa hẹn lợi nhuận hay thời điểm phát tài.`,
    family: `Gia đạo là trục cần đọc kỹ. Với ${row.canChi} ${gender}, tình thương nên chuyển từ gánh thay sang đồng hành: hỏi người thân cần gì, nói mình lo điều gì, đặt nguyên tắc tiền chung - riêng và chia việc chăm sóc rõ. Nếu cứ im lặng chịu đựng, người nhà dễ quen với việc mọi thứ luôn có mình đứng ra xử lý; nếu nói quá cứng, kinh nghiệm tốt lại thành áp lực.`,
    health: `Sức khỏe của ${row.canChi} ${gender} nên được xem là nền của mọi vận trình. Nhóm tuổi ${row.year} cần để ý giấc ngủ, tiêu hóa, huyết áp, xương khớp, mắt, thuốc đang dùng và các dấu hiệu mệt kéo dài. Nếu có đau bất thường, khó thở, chóng mặt, mất ngủ lâu ngày hoặc thay đổi sức khỏe rõ, cần gặp bác sĩ. Bài tử vi chỉ là gợi ý thói quen, không thay thế chẩn đoán.`,
    stages: [
      ["Trước 30 tuổi", `${row.canChi} ${gender} thường học tự lập qua nghề, gia đình hoặc trách nhiệm sớm; bài học chính là chọn kỹ năng đủ sâu và không tự ép mình gánh vượt sức.`],
      ["30-45 tuổi", `Trung vận nên dựng nghề chính, nhà cửa và nếp tiền bạc. Người sinh ${row.year} cần ghi rõ cam kết hùn hạp, vay mượn, hỗ trợ gia đình và không để tình cảm thay cho giấy tờ.`],
      ["45-60 tuổi", `${row.canChi} bước vào chặng dùng uy tín để ổn định vị thế; nên rà tài sản, sức khỏe, người kế nhiệm và vai trò của từng người trong nhà trước khi có biến động.`],
      ["Sau 60 tuổi", `Hậu vận của ${row.canChi} ${row.year} ${gender} nên sống chậm, giữ lịch khám, sắp xếp hồ sơ, truyền kinh nghiệm bằng giọng mềm và để con cháu tự chịu phần phù hợp.`],
    ],
    advice: `Lời khuyên cho ${title} là dùng kinh nghiệm để làm đời sống nhẹ hơn, không để nó thành lý do ôm thêm việc. Việc lớn nên ghi phương án, hỏi người có chuyên môn và chỉ nhận phần hợp sức mình.`,
    siblingLink: {
      href: `/${slugFor(row, otherGender)}`,
      label: `Tử vi trọn đời tuổi ${row.canChi} ${row.year} ${otherGender}`,
    },
  };
}

export const historicalLifetimeAgeArticleInputs = years.flatMap((row) => [
  buildArticle(row, "nam mạng"),
  buildArticle(row, "nữ mạng"),
]);

export const historicalLifetimeArticleSlugs = historicalLifetimeAgeArticleInputs.map((item) => item.slug);

export const historicalLifetimeCards: HistoricalLifetimeCard[] = historicalLifetimeAgeArticleInputs.map((item) => ({
  id: item.slug.replace("tu-vi-tron-doi-tuoi-", "tu-vi-tron-doi-"),
  detailsPath: `/${item.slug}`,
  title: item.title,
  year: item.year,
  canChi: item.canChi,
  gender: item.gender === "nam mạng" ? "Nam mạng" : "Nữ mạng",
  overview: item.summary,
  work: item.work,
  family: item.family,
  caution: `${item.health} ${item.riskAges}`,
}));
