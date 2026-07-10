import {
  CURATED_PSEO_SLUGS,
  MANUAL_PSEO_BATCH_3_SLUGS,
  MANUAL_PSEO_BATCH_4_SLUGS,
  MANUAL_PSEO_BATCH_5_SLUGS,
  MANUAL_PSEO_BATCH_6_SLUGS,
  MANUAL_PSEO_BATCH_7_SLUGS,
  MANUAL_PSEO_BATCH_8_SLUGS,
  MANUAL_PSEO_BATCH_9_SLUGS,
  MANUAL_PSEO_BATCH_10_SLUGS,
  getCuratedPseoContent,
} from "./pseo-curated.ts";

export type PseoEntityKind = "MAIN_STAR" | "PALACE" | "SUPPORT_STAR";
export type PseoPageKind = "HUB" | "ENTITY" | "COMBINATION";
export type PseoStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PseoEntityDefinition = {
  kind: PseoEntityKind;
  slug: string;
  name: string;
  element: string;
  summary: string;
  strengths: string[];
  cautions: string[];
  canonicalPath?: string;
};

export type PseoScores = {
  potential: number;
  stability: number;
  adaptability: number;
  caution: number;
};

export type PseoPageDraft = {
  kind: PseoPageKind;
  status: PseoStatus;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  starSlug: string;
  palaceSlug: string;
  element: string;
  goodPoints: string[];
  cautionPoints: string[];
  scores: PseoScores;
  faqs: { question: string; answer: string }[];
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
  publishedAt: Date;
  updatedAt: Date;
};

export function pseoEntityPath(kind: PseoEntityKind, slug: string) {
  if (kind === "MAIN_STAR") return `/tra-cuu/sao-${slug}`;
  if (kind === "PALACE") return `/tra-cuu/cung-${slug}`;
  if (kind === "SUPPORT_STAR") return `/tra-cuu/phu-tinh/${slug}`;
  return undefined;
}

export function pseoEntityRouteSlug(kind: PseoEntityKind, slug: string) {
  if (kind === "SUPPORT_STAR") return undefined;
  return pseoEntityPath(kind, slug)?.replace("/tra-cuu/", "");
}

export const MAIN_STARS: PseoEntityDefinition[] = [
  ["tu-vi", "Tử Vi", "Thổ", "khả năng tổ chức, dẫn dắt và giữ trật tự", ["biết quy tụ nguồn lực", "có ý thức trách nhiệm"], ["dễ ôm việc", "dễ đặt nặng vị thế"]],
  ["thien-co", "Thiên Cơ", "Mộc", "tư duy, tính toán và khả năng thay đổi phương án", ["nhạy với dữ kiện", "giỏi tìm lối đi khác"], ["dễ phân tán", "cần tránh đổi hướng liên tục"]],
  ["thai-duong", "Thái Dương", "Hỏa", "sự rõ ràng, trách nhiệm và khả năng soi sáng vấn đề", ["dám đứng ra", "truyền đạt dễ hiểu"], ["dễ quá tải vì kỳ vọng", "cần cân bằng cho và nhận"]],
  ["vu-khuc", "Vũ Khúc", "Kim", "tính thực tế, năng lực quản trị nguồn lực và kỷ luật", ["quyết đoán", "coi trọng hiệu quả"], ["dễ cứng", "khó nói ra nhu cầu cảm xúc"]],
  ["thien-dong", "Thiên Đồng", "Thủy", "sự mềm dẻo, trải nghiệm và khả năng thích nghi", ["dễ hòa nhập", "biết làm dịu căng thẳng"], ["dễ trì hoãn", "cần mục tiêu rõ"]],
  ["liem-trinh", "Liêm Trinh", "Hỏa", "ranh giới, nguyên tắc và sức hút cá nhân", ["giữ chuẩn mực", "nhạy với đúng sai"], ["dễ cực đoan", "cần tránh phản ứng nóng"]],
  ["thien-phu", "Thiên Phủ", "Thổ", "khả năng chứa đựng, bảo toàn và điều phối", ["bền bỉ", "biết tạo nền an toàn"], ["dễ quá thận trọng", "có thể chậm quyết định"]],
  ["thai-am", "Thái Âm", "Thủy", "độ sâu nội tâm, tích lũy và khả năng quan sát tinh tế", ["biết tính đường dài", "nhạy với nhu cầu người khác"], ["dễ suy nghĩ quá mức", "cần tránh quyết định theo lo lắng"]],
  ["tham-lang", "Tham Lang", "Thủy", "ham học hỏi, giao tiếp và nhu cầu mở rộng trải nghiệm", ["linh hoạt", "có sức hút xã hội"], ["dễ quá tay", "cần giới hạn rõ"]],
  ["cu-mon", "Cự Môn", "Thủy", "ngôn ngữ, tranh biện và khả năng nhìn ra điểm chưa rõ", ["phân tích tốt", "dám đặt câu hỏi"], ["dễ vướng hiểu nhầm", "cần kiểm soát cách nói"]],
  ["thien-tuong", "Thiên Tướng", "Thủy", "khả năng hỗ trợ, bảo vệ tiêu chuẩn và phối hợp", ["biết đứng giữa", "giữ sự công bằng"], ["dễ lệ thuộc đánh giá", "cần quyết định dứt khoát"]],
  ["thien-luong", "Thiên Lương", "Mộc", "tính bảo hộ, đạo lý và kinh nghiệm", ["biết nâng đỡ", "nhìn được hậu quả dài hạn"], ["dễ phán xét", "cần linh hoạt với hoàn cảnh"]],
  ["that-sat", "Thất Sát", "Kim", "quyết đoán, chịu áp lực và năng lực phá thế bế tắc", ["hành động nhanh", "chịu trách nhiệm trong tình huống khó"], ["dễ mạo hiểm", "cần dữ kiện trước quyết định lớn"]],
  ["pha-quan", "Phá Quân", "Thủy", "đổi mới, kết thúc chu kỳ cũ và tái cấu trúc", ["dám thay đổi", "hợp xử lý giai đoạn chuyển tiếp"], ["dễ phá bỏ quá sớm", "cần kế hoạch dự phòng"]],
].map(([slug, name, element, summary, strengths, cautions]) => ({
  kind: "MAIN_STAR",
  slug: String(slug),
  name: String(name),
  element: String(element),
  summary: String(summary),
  strengths: strengths as string[],
  cautions: cautions as string[],
  canonicalPath: pseoEntityPath("MAIN_STAR", String(slug)),
}));

export const PALACES: PseoEntityDefinition[] = [
  ["menh", "Mệnh", "Bản thân", "khí chất, cách phản ứng và lựa chọn nền"],
  ["phu-mau", "Phụ Mẫu", "Gia đình", "quan hệ với cha mẹ, người lớn và nguồn nâng đỡ ban đầu"],
  ["phuc-duc", "Phúc Đức", "Nền tảng", "đời sống tinh thần, nếp gia đình và độ bền nội tâm"],
  ["dien-trach", "Điền Trạch", "Tài sản", "nhà cửa, không gian sống và cách tạo nền ổn định"],
  ["quan-loc", "Quan Lộc", "Sự nghiệp", "công việc, trách nhiệm và con đường tạo giá trị"],
  ["no-boc", "Nô Bộc", "Quan hệ", "bạn bè, đồng nghiệp, đội nhóm và cách hợp tác"],
  ["thien-di", "Thiên Di", "Môi trường", "cách bước ra bên ngoài, dịch chuyển và thích nghi xã hội"],
  ["tat-ach", "Tật Ách", "Sức bền", "thói quen, áp lực và tín hiệu cần chăm sóc bản thân"],
  ["tai-bach", "Tài Bạch", "Tài chính", "cách tạo, dùng, giữ và nhìn nhận nguồn lực"],
  ["tu-tuc", "Tử Tức", "Thế hệ", "con cái, dự án dài hạn và điều được nuôi dưỡng"],
  ["phu-the", "Phu Thê", "Gắn kết", "quan hệ đôi lứa, kỳ vọng và cách cùng nhau quyết định"],
  ["huynh-de", "Huynh Đệ", "Đồng hành", "anh chị em, người ngang hàng và mạng lưới gần"],
].map(([slug, name, element, summary]) => ({
  kind: "PALACE",
  slug: String(slug),
  name: String(name),
  element: String(element),
  summary: String(summary),
  strengths: [`làm rõ ${String(summary)}`, "tạo một góc nhìn thực tế để đối chiếu"],
  cautions: ["không đọc tách khỏi toàn lá số", "không dùng một cung để kết luận chắc chắn"],
  canonicalPath: pseoEntityPath("PALACE", String(slug)),
}));

export const SUPPORT_STARS: PseoEntityDefinition[] = [
  ["tuan", "Tuần", "Điều chỉnh", "làm chậm, lọc và buộc một vấn đề phải đi qua giai đoạn kiểm tra"],
  ["triet", "Triệt", "Gián đoạn", "cắt bớt quán tính cũ và tạo yêu cầu thích nghi"],
  ["hoa-loc", "Hóa Lộc", "Gia tăng", "khả năng thu hút nguồn lực và mở rộng điều kiện thuận lợi"],
  ["hoa-quyen", "Hóa Quyền", "Chủ động", "quyền quyết định, trách nhiệm và sức tác động"],
  ["hoa-khoa", "Hóa Khoa", "Học hỏi", "khả năng làm rõ, sửa sai và tạo uy tín bằng tri thức"],
  ["hoa-ky", "Hóa Kỵ", "Vướng mắc", "điểm dễ ám ảnh, hiểu nhầm hoặc cần xử lý kỹ"],
].map(([slug, name, element, summary]) => ({
  kind: "SUPPORT_STAR",
  slug: String(slug),
  name: String(name),
  element: String(element),
  summary: String(summary),
  strengths: ["tạo thêm lớp ngữ cảnh", "giúp nhận ra điểm cần ưu tiên"],
  cautions: ["không tự đứng một mình", "cần đọc cùng chính tinh và cung"],
  canonicalPath: pseoEntityPath("SUPPORT_STAR", String(slug)),
}));

function stableScore(starIndex: number, palaceIndex: number, salt: number) {
  return 4 + ((starIndex * 7 + palaceIndex * 5 + salt * 3) % 7);
}

export function pseoScores(starSlug: string, palaceSlug: string): PseoScores {
  const starIndex = Math.max(0, MAIN_STARS.findIndex((item) => item.slug === starSlug));
  const palaceIndex = Math.max(0, PALACES.findIndex((item) => item.slug === palaceSlug));
  return {
    potential: stableScore(starIndex, palaceIndex, 1),
    stability: stableScore(starIndex, palaceIndex, 2),
    adaptability: stableScore(starIndex, palaceIndex, 3),
    caution: stableScore(starIndex, palaceIndex, 4),
  };
}

const STAR_SERP_ANGLES: Record<string, { title: string; snippet: string }> = {
  "tu-vi": { title: "vai trò trung tâm", snippet: "nhu cầu tổ chức, giữ vai trò và điều phối đại cục" },
  "thien-co": { title: "mưu lược xoay chuyển", snippet: "tư duy linh hoạt, khả năng đổi phương án và xử lý dữ kiện" },
  "thai-duong": { title: "trách nhiệm soi sáng", snippet: "sự rõ ràng, trách nhiệm và nhu cầu đứng ra gánh việc" },
  "vu-khuc": { title: "kỷ luật nguồn lực", snippet: "tính thực tế, kỷ luật và cách quản trị nguồn lực" },
  "thien-dong": { title: "thích nghi mềm dẻo", snippet: "khả năng hòa nhịp, làm dịu căng thẳng và thích nghi" },
  "liem-trinh": { title: "ranh giới đúng sai", snippet: "nguyên tắc, sức hút và cách giữ ranh giới cá nhân" },
  "thien-phu": { title: "bảo toàn nền tảng", snippet: "khả năng chứa đựng, bảo toàn và điều phối bền bỉ" },
  "thai-am": { title: "cảm nhận và tích lũy", snippet: "độ sâu nội tâm, nhu cầu an toàn và năng lực quan sát tinh tế" },
  "tham-lang": { title: "ham muốn mở rộng", snippet: "sức hút xã hội, nhu cầu trải nghiệm và khả năng học qua va chạm" },
  "cu-mon": { title: "phản biện và lời nói", snippet: "ngôn ngữ, tranh biện và khả năng nhìn ra điểm chưa rõ" },
  "thien-tuong": { title: "bảo vệ tiêu chuẩn", snippet: "khả năng hỗ trợ, giữ công bằng và bảo vệ chuẩn mực" },
  "thien-luong": { title: "kinh nghiệm bảo hộ", snippet: "đạo lý, kinh nghiệm và cách nâng đỡ người khác" },
  "that-sat": { title: "quyết đoán áp lực", snippet: "sự dứt khoát, sức chịu áp lực và năng lực cắt bế tắc" },
  "pha-quan": { title: "phá cũ lập mới", snippet: "năng lực tái cấu trúc, kết thúc chu kỳ cũ và mở hướng mới" },
};

const PALACE_SERP_ANGLES: Record<string, { title: string; snippet: string }> = {
  "menh": { title: "bản thân", snippet: "khí chất, phản ứng đầu tiên và cách tự định vị" },
  "phu-mau": { title: "cha mẹ", snippet: "nếp gia đình, người lớn và nguồn nâng đỡ ban đầu" },
  "phuc-duc": { title: "phúc phần", snippet: "đời sống tinh thần, nền gia tộc và sức bền nội tâm" },
  "dien-trach": { title: "nhà cửa", snippet: "nhà cửa, tài sản, không gian sống và nền ổn định" },
  "quan-loc": { title: "sự nghiệp", snippet: "công việc, trách nhiệm và cách tạo giá trị xã hội" },
  "no-boc": { title: "bạn bè", snippet: "bạn bè, cộng sự, đội nhóm và cách hợp tác" },
  "thien-di": { title: "ra ngoài", snippet: "môi trường xã hội, dịch chuyển và phản ứng khi bước ra ngoài" },
  "tat-ach": { title: "áp lực", snippet: "thói quen, sức bền và tín hiệu cần chăm sóc bản thân" },
  "tai-bach": { title: "tiền bạc", snippet: "tiền bạc, tài sản và cách tạo-dùng-giữ nguồn lực" },
  "tu-tuc": { title: "con cái", snippet: "con cái, dự án dài hạn và điều được nuôi dưỡng" },
  "phu-the": { title: "hôn nhân", snippet: "quan hệ đôi lứa, kỳ vọng và cách cùng nhau quyết định" },
  "huynh-de": { title: "anh em", snippet: "anh chị em, người ngang hàng và mạng lưới gần" },
};

function pseoSerpCopy(star: PseoEntityDefinition, palace: PseoEntityDefinition) {
  const starAngle = STAR_SERP_ANGLES[star.slug] || { title: star.summary, snippet: star.summary };
  const palaceAngle = PALACE_SERP_ANGLES[palace.slug] || { title: palace.summary, snippet: palace.summary };
  return {
    title: `${star.name} cung ${palace.name}: ${starAngle.title} trong ${palaceAngle.title}`,
    excerpt: `Khi ${star.name} gặp cung ${palace.name}, trọng tâm là ${starAngle.snippet} đặt vào chủ đề ${palaceAngle.snippet}.`,
    metaTitle: `${star.name} cung ${palace.name}: ${starAngle.title} ở ${palaceAngle.title}`,
    metaDescription: `Đọc ${star.name} tại ${palace.name} qua ${starAngle.snippet}; đối chiếu với ${palaceAngle.snippet}, điểm dễ lệch và câu hỏi tự kiểm trong lá số.`,
  };
}

function bodyFor(star: PseoEntityDefinition, palace: PseoEntityDefinition, scores: PseoScores) {
  const sameStarLinks = PALACES.filter((item) => item.slug !== palace.slug).slice(0, 3)
    .map((item) => `[${star.name} cung ${item.name}](/tra-cuu/sao-${star.slug}-cung-${item.slug})`).join(", ");
  const samePalaceLinks = MAIN_STARS.filter((item) => item.slug !== star.slug).slice(0, 3)
    .map((item) => `[${item.name} cung ${palace.name}](/tra-cuu/sao-${item.slug}-cung-${palace.slug})`).join(", ");
  const contexts = [
    `Khi đặt ${star.name} vào cung ${palace.name}, người đọc đang ghép ${star.summary} với chủ đề ${palace.summary}. Hai lớp này cần được xem như một mối quan hệ, không phải hai nhãn tốt xấu đứng riêng.`,
    `Điểm có ích nhất của tổ hợp này là giúp xác định cách một khuynh hướng được biểu hiện trong đời sống. ${star.name} cho biết kiểu năng lượng, còn cung ${palace.name} chỉ ra nơi năng lượng đó thường được quan sát rõ hơn.`,
    `Mức tiềm năng ${scores.potential}/10 và độ ổn định ${scores.stability}/10 là thang tham khảo được tính từ ma trận thuộc tính cố định. Chúng không phải xác suất thành công, lời tiên đoán hay cam kết về kết quả.`,
    `Người có tổ hợp này nên đối chiếu với việc đã xảy ra, thói quen ra quyết định và môi trường thực tế. Nếu câu chữ không khớp, cần kiểm tra giờ sinh, trạng thái sao, bộ sao đi cùng và vận đang tác động.`,
    `Trong thực hành, ${star.strengths.join(" và ")} có thể hỗ trợ chủ đề ${palace.name}. Ngược lại, ${star.cautions.join(" và ")} là các điểm nên quan sát trước khi đưa ra quyết định lớn.`,
    `Một cách đọc an toàn là bắt đầu từ câu hỏi thật, xác định cung liên quan, xem chính tinh và phụ tinh, rồi mới nối sang đại vận hoặc lưu niên. Làm ngược thứ tự dễ khiến người đọc chỉ chọn câu hợp ý mình.`,
  ];
  const expanded = Array.from({ length: 1 }, (_, round) =>
    contexts.map((paragraph) =>
      `${paragraph} Ở vòng đối chiếu ${round + 1}, hãy ghi lại một ví dụ cụ thể về ${palace.name.toLowerCase()} trong đời sống, phân biệt dữ kiện với cảm xúc, rồi xem đặc tính ${star.name} đang hỗ trợ hay tạo áp lực ở bước nào. Cách ghi chép này giúp phần luận có ích thực tế và tránh biến tử vi thành kết luận tuyệt đối.`,
    ).join("\n\n"),
  ).join("\n\n");

  return `## ${star.name} tại cung ${palace.name} nói về điều gì?

${contexts[0]}

| Lớp đọc | Nội dung cần quan sát | Cách kiểm tra |
| --- | --- | --- |
| Chính tinh | ${star.summary} | So với cách bạn thường phản ứng và quyết định |
| Cung | ${palace.summary} | So với sự kiện thật trong đúng lĩnh vực |
| Bối cảnh | Bộ sao, trạng thái và vận | Không kết luận từ một yếu tố đơn lẻ |

## Điểm thuận lợi có thể phát huy

${contexts[1]} Hai điểm nổi bật là **${star.strengths[0]}** và **${star.strengths[1]}**. Đây là khả năng có thể rèn luyện, không phải đặc quyền cố định.

- Ưu tiên một hành động nhỏ có thể đo được trong chủ đề ${palace.name}.
- Dùng phản hồi thực tế để điều chỉnh thay vì chỉ dựa vào cảm giác.
- Đọc thêm [ý nghĩa 14 chính tinh](/tra-cuu/y-nghia-14-chinh-tinh) và [ý nghĩa 12 cung](/tra-cuu/y-nghia-12-cung).

## Điểm cần thận trọng

${contexts[4]} Không nên dùng các tín hiệu này để tự chẩn đoán sức khỏe, quyết định đầu tư hoặc đưa ra phán quyết chắc chắn về quan hệ.

| Chỉ số tham khảo | Điểm | Ý nghĩa sử dụng |
| --- | ---: | --- |
| Tiềm năng phát huy | ${scores.potential}/10 | Mức độ dễ nhận ra thế mạnh khi có môi trường phù hợp |
| Độ ổn định | ${scores.stability}/10 | Nhu cầu xây quy trình và duy trì nhịp đều |
| Khả năng thích nghi | ${scores.adaptability}/10 | Mức linh hoạt khi điều kiện thay đổi |
| Mức cần thận trọng | ${scores.caution}/10 | Lời nhắc kiểm tra dữ kiện trước quyết định |

## Cách đọc theo công việc, tài chính và quan hệ

${expanded}

## Khi nào nên xem thêm vận hạn?

${contexts[5]} Bạn có thể đọc tiếp [đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi) và dùng công cụ [xem ngày tốt xấu](/xem-ngay) khi cần chọn thời điểm cho một việc cụ thể.

## Đối chiếu với lá số cá nhân

${contexts[3]} Hãy [lập lá số miễn phí](/#lap-la-so) để xem ${star.name} có thực sự nằm tại cung ${palace.name}, đang ở trạng thái nào và đi cùng những sao gì.

## Các tổ hợp liên quan

Cùng sao, khác cung: ${sameStarLinks}.

Cùng cung, khác sao: ${samePalaceLinks}.`;
}

export function buildPseoDraft(starSlug: string, palaceSlug: string): PseoPageDraft {
  const star = MAIN_STARS.find((item) => item.slug === starSlug);
  const palace = PALACES.find((item) => item.slug === palaceSlug);
  if (!star || !palace) throw new Error(`Unknown pSEO combination: ${starSlug}/${palaceSlug}`);
  const scores = pseoScores(starSlug, palaceSlug);
  const serp = pseoSerpCopy(star, palace);
  const title = serp.title;
  const slug = `sao-${star.slug}-cung-${palace.slug}`;
  const now = new Date("2026-06-25T00:00:00+07:00");
  return {
    kind: "COMBINATION",
    status: "PUBLISHED",
    slug,
    title,
    excerpt: serp.excerpt,
    body: bodyFor(star, palace, scores),
    starSlug,
    palaceSlug,
    element: star.element,
    goodPoints: star.strengths,
    cautionPoints: star.cautions,
    scores,
    faqs: [
      {
        question: `${star.name} ở cung ${palace.name} có chắc chắn tốt không?`,
        answer: "Không. Cần đọc thêm trạng thái sao, bộ sao đi cùng, tam hợp, xung chiếu và vận đang tác động.",
      },
      {
        question: `Làm sao biết phần luận ${star.name} cung ${palace.name} có phù hợp?`,
        answer: "Hãy kiểm tra lại dữ liệu sinh và đối chiếu từng nhận định với sự kiện thực tế thay vì nhận toàn bộ câu chữ.",
      },
    ],
    focusKeyword: `sao ${star.name.toLowerCase()} cung ${palace.name.toLowerCase()}`,
    metaTitle: serp.metaTitle,
    metaDescription: serp.metaDescription,
    canonicalUrl: `/tra-cuu/${slug}`,
    robots: "index,follow",
    publishedAt: now,
    updatedAt: now,
  };
}

export function buildPseoCombinations() {
  return MAIN_STARS.flatMap((star) => PALACES.map((palace) => buildPseoDraft(star.slug, palace.slug)));
}

export { CURATED_PSEO_SLUGS, MANUAL_PSEO_BATCH_3_SLUGS, MANUAL_PSEO_BATCH_4_SLUGS, MANUAL_PSEO_BATCH_5_SLUGS, MANUAL_PSEO_BATCH_6_SLUGS, MANUAL_PSEO_BATCH_7_SLUGS, MANUAL_PSEO_BATCH_8_SLUGS, MANUAL_PSEO_BATCH_9_SLUGS, MANUAL_PSEO_BATCH_10_SLUGS };

export function buildPseoInventory() {
  const curated = new Set<string>(CURATED_PSEO_SLUGS);
  return buildPseoCombinations().map((page) => {
    const content = getCuratedPseoContent(page.slug);
    if (!curated.has(page.slug) || !content) {
      return {
        ...page,
        status: "DRAFT" as const,
        robots: "noindex,follow",
        publishedAt: new Date("2026-06-25T00:00:00+07:00"),
      };
    }
    return {
      ...page,
      ...content,
      status: "PUBLISHED" as const,
      robots: "index,follow",
      publishedAt: new Date("2026-06-25T00:00:00+07:00"),
      updatedAt: new Date("2026-06-25T00:00:00+07:00"),
    };
  });
}
