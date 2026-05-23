import { scoreArticleSeo } from "@/lib/seo";

export type ArticleView = {
  id: string;
  categoryId?: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  coverImage?: string | null;
  coverAlt?: string | null;
  focusKeyword?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  schemaType?: string | null;
  faqs?: { question: string; answer: string }[];
  category?: ArticleCategoryView | null;
  seoScore?: number;
  seoChecklist?: unknown;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

export type ArticleCategoryView = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

function article(input: Omit<ArticleView, "id" | "status" | "robots" | "schemaType" | "publishedAt" | "updatedAt"> & { date: string }): ArticleView {
  return {
    id: `seed-${input.slug}`,
    status: "published",
    coverImage: input.coverImage || `/articles/${input.slug}.svg`,
    robots: "index,follow",
    schemaType: "Article",
    publishedAt: new Date(`${input.date}T00:00:00+07:00`),
    updatedAt: new Date(`${input.date}T00:00:00+07:00`),
    ...input,
  };
}

const cta = `## Thực hành trên lá số cá nhân

Ý nghĩa cung và vận hạn sẽ rõ hơn khi đối chiếu với lá số riêng. Bạn có thể [lập lá số tử vi miễn phí](/#lap-la-so), sau đó đọc tiếp các phần [luận cung](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi), [đại vận](/kien-thuc-tu-vi/dai-van-la-gi) và [xem ngày](/xem-ngay) để hiểu nhịp vận theo từng lớp thời gian.

## Nguồn tham khảo và kỹ thuật SEO

- Website dùng canonical URL, sitemap, dữ liệu có cấu trúc Article và liên kết nội bộ để crawler hiểu quan hệ giữa các bài.
- Phần schema tham khảo từ [Schema.org Article](https://schema.org/Article).
- Cách viết title, description và liên kết ngoài tham khảo [Google Search Central SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- Khi dẫn nguồn ngoài, hãy ưu tiên trang chính thống; khi đặt link quảng cáo hoặc trả phí cần đánh dấu đúng quan hệ theo hướng dẫn [qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).`;

export const seedArticles: ArticleView[] = [
  article({
    title: "Tử vi hằng ngày: Cách đọc vận khí không mê tín",
    slug: "tu-vi-hang-ngay-cach-doc-van-khi",
    excerpt: "Cách đọc tử vi hằng ngày theo hướng ứng dụng: kết hợp lá số gốc, nhịp tháng, nhịp ngày và quyết định thực tế.",
    focusKeyword: "tử vi hằng ngày",
    coverImage: "/articles/tu-vi-hang-ngay.svg",
    coverAlt: "Vòng can chi và lịch xem ngày tốt xấu",
    metaTitle: "Tử vi hằng ngày: Cách đọc vận khí ứng dụng",
    metaDescription: "Tìm hiểu cách đọc tử vi hằng ngày có trách nhiệm, kết hợp lá số gốc, vận tháng, vận ngày và lựa chọn thực tế.",
    canonicalUrl: "/kien-thuc-tu-vi/tu-vi-hang-ngay-cach-doc-van-khi",
    date: "2026-06-06",
    content: `Tử vi hằng ngày là cách quan sát nhịp vận khí theo ngày để chủ động hơn trong công việc, tài chính và các mối quan hệ. Điều quan trọng không phải là tin tuyệt đối vào một kết luận cố định, mà là hiểu xu hướng để chọn hành động tỉnh táo.

## Vì sao cần xem cả lá số gốc

Một ngày tốt với người này chưa chắc phù hợp với người khác. Lá số gốc cho biết nền tảng mệnh, thân, cục, cung Quan Lộc, Tài Bạch và Thiên Di. Khi ghép với vận năm, vận tháng và vận ngày, lời khuyên sẽ sát hơn so với chỉ xem can chi chung.

## Cách ứng dụng thực tế

Bạn có thể dùng tử vi để chọn thời điểm khởi sự nhẹ, điều chỉnh nhịp làm việc hoặc nhận diện giai đoạn nên giữ sức. Với quyết định quan trọng, hãy kết hợp thêm dữ liệu thực tế, khả năng tài chính và lời khuyên chuyên môn.

${cta}`,
  }),
  article({
    title: "Cung Mệnh và Cung Thân: Hai trục chính khi luận lá số",
    slug: "cung-menh-cung-than",
    excerpt: "Cung Mệnh cho thấy nền tính cách, Cung Thân phản ánh cách con người nhập cuộc và hành động trong đời sống.",
    focusKeyword: "cung mệnh cung thân",
    coverImage: "/articles/cung-menh-than.svg",
    coverAlt: "Bàn lá số tử vi với cung Mệnh và cung Thân",
    metaTitle: "Cung Mệnh và Cung Thân trong lá số tử vi",
    metaDescription: "Tìm hiểu ý nghĩa Cung Mệnh, Cung Thân và cách hai trục này giúp đọc tính cách, hành động và vận trình trong lá số.",
    canonicalUrl: "/kien-thuc-tu-vi/cung-menh-cung-than",
    date: "2026-05-01",
    content: `Cung Mệnh là điểm khởi đầu để đọc khí chất, thiên hướng và cách một người phản ứng với hoàn cảnh. Cung Thân thường được xem như cách năng lượng đó biểu hiện rõ hơn khi trưởng thành.

## Mệnh và Thân khác nhau thế nào

Mệnh giống phần gốc rễ: tính khí, cách nhìn đời và khuynh hướng ban đầu. Thân giống phần nhập cuộc: cách bạn hành động, chịu trách nhiệm và tạo dấu ấn khi đi qua trải nghiệm sống.

## Khi luận giải bằng AI

Một hệ thống tử vi có trách nhiệm cần đưa dữ liệu lá số vào prompt có cấu trúc, sau đó yêu cầu AI giải thích bằng ngôn ngữ dễ hiểu thay vì tự bịa công thức an sao.

${cta}`,
  }),
  article({
    title: "12 cung trong lá số tử vi: Nên đọc cung nào trước?",
    slug: "12-cung-trong-la-so-tu-vi",
    excerpt: "Tổng quan 12 cung tử vi và thứ tự đọc dễ hiểu cho người mới: Mệnh, Tài Bạch, Quan Lộc, Phu Thê, Tật Ách.",
    focusKeyword: "12 cung tử vi",
    coverImage: "/articles/la-so-12-cung.svg",
    coverAlt: "Bàn lá số tử vi 12 cung",
    metaTitle: "12 cung trong lá số tử vi và thứ tự đọc cho người mới",
    metaDescription: "Hiểu nhanh 12 cung trong lá số tử vi, cung nào nên đọc trước và cách liên kết Mệnh, Tài Bạch, Quan Lộc với đời sống.",
    canonicalUrl: "/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi",
    date: "2026-05-10",
    content: `12 cung trong lá số tử vi là 12 vùng đời sống. Mỗi cung không đứng riêng lẻ, mà cần đọc trong quan hệ với Mệnh, Thân, chính tinh, phụ tinh và vận hạn.

## Thứ tự đọc gợi ý

Người mới nên bắt đầu từ Cung Mệnh và Cung Thân, sau đó đọc Tài Bạch, Quan Lộc, Phu Thê, Tật Ách. Cách này giúp bạn đi từ nền tảng bản thân đến tiền bạc, công việc, quan hệ và sức khỏe.

## Không nên đọc từng cung quá tách rời

Một cung mạnh chưa chắc đủ tạo kết quả nếu vận hạn chưa thuận. Ngược lại, cung có sao khó vẫn có thể trở thành lời nhắc để quản trị rủi ro tốt hơn.

${cta}`,
  }),
  article({
    title: "Cung Tài Bạch: Cách đọc năng lực kiếm tiền trong tử vi",
    slug: "cung-tai-bach-trong-tu-vi",
    excerpt: "Cung Tài Bạch phản ánh thái độ với tiền, năng lực tạo tài chính và cách quản lý nguồn lực cá nhân.",
    focusKeyword: "cung tài bạch",
    coverImage: "/articles/tai-bach-quan-loc.svg",
    coverAlt: "Cung Tài Bạch và các chỉ báo tài chính trong tử vi",
    metaTitle: "Cung Tài Bạch trong tử vi: Năng lực kiếm tiền và quản lý tài chính",
    metaDescription: "Tìm hiểu Cung Tài Bạch trong lá số tử vi, cách đọc năng lực kiếm tiền, quản lý tài chính và các điểm cần thận trọng.",
    canonicalUrl: "/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi",
    date: "2026-05-12",
    content: `Cung Tài Bạch không chỉ nói về tiền nhiều hay ít. Nó phản ánh cách một người tạo nguồn lực, quản trị tài chính, chấp nhận rủi ro và định nghĩa sự đủ đầy.

## Khi nào Tài Bạch dễ phát huy

Tài Bạch cần được đọc cùng Mệnh, Quan Lộc và Đại vận. Nếu cung tiền bạc có sao thuận nhưng vận chưa tới, lời khuyên thực tế là chuẩn bị kỹ năng, dòng tiền và kỷ luật chi tiêu.

## Ứng dụng trong đời sống

Khi đọc Cung Tài Bạch, hãy biến luận giải thành câu hỏi hành động: mình kiếm tiền tốt nhất bằng năng lực nào, cần tránh kiểu tiêu tiền nào, và nên học thêm kỹ năng gì?

${cta}`,
  }),
  article({
    title: "Cung Quan Lộc: Đọc định hướng sự nghiệp và công danh",
    slug: "cung-quan-loc-trong-tu-vi",
    excerpt: "Cung Quan Lộc giúp nhìn nhịp học tập, công việc, trách nhiệm và môi trường sự nghiệp phù hợp.",
    focusKeyword: "cung quan lộc",
    coverImage: "/articles/tai-bach-quan-loc.svg",
    coverAlt: "Cung Quan Lộc và biểu đồ phát triển sự nghiệp",
    metaTitle: "Cung Quan Lộc trong tử vi: Sự nghiệp, học tập và công danh",
    metaDescription: "Hiểu ý nghĩa Cung Quan Lộc trong tử vi và cách ứng dụng để định hướng công việc, học tập và nhịp phát triển sự nghiệp.",
    canonicalUrl: "/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi",
    date: "2026-05-14",
    content: `Cung Quan Lộc là nơi đọc thái độ với trách nhiệm, cách làm việc, môi trường nghề nghiệp và nhịp thăng tiến. Đây là cung nên xem sớm nếu bạn đang cần định hướng công việc.

## Đọc Quan Lộc cùng Tài Bạch

Quan Lộc nói về con đường tạo giá trị, Tài Bạch nói về cách giá trị đó chuyển thành tài chính. Khi hai cung hỗ trợ nhau, người xem dễ xác định hướng nghề và cách kiếm tiền phù hợp hơn.

## Lời khuyên thực tế

Luận Quan Lộc tốt nên kết thúc bằng hành động: học kỹ năng nào, chọn môi trường nào, tránh kiểu xung đột nào và nên xây uy tín trong bao lâu.

${cta}`,
  }),
  article({
    title: "Đại vận là gì? Cách đọc chu kỳ 10 năm trong tử vi",
    slug: "dai-van-la-gi",
    excerpt: "Đại vận cho biết nhịp 10 năm, giai đoạn mở rộng, tích lũy hay cần thận trọng trong đời sống.",
    focusKeyword: "đại vận",
    coverImage: "/articles/dai-van.svg",
    coverAlt: "Biểu đồ đại vận 10 năm trong tử vi",
    metaTitle: "Đại vận là gì? Cách đọc chu kỳ 10 năm trong tử vi",
    metaDescription: "Tìm hiểu Đại vận trong tử vi, cách đọc chu kỳ 10 năm và cách ứng dụng để lên kế hoạch công việc, tài chính, quan hệ.",
    canonicalUrl: "/kien-thuc-tu-vi/dai-van-la-gi",
    date: "2026-05-16",
    content: `Đại vận là lớp thời gian dài, thường dùng để đọc xu hướng 10 năm. Nó không thay thế quyết định cá nhân, nhưng giúp bạn hiểu giai đoạn nào nên mở rộng, giai đoạn nào nên tích lũy.

## Vì sao Đại vận quan trọng

Cùng một lá số gốc, mỗi đại vận có trọng tâm khác nhau. Khi vận đi vào cung liên quan đến sự nghiệp, tài chính hoặc quan hệ, người xem có thể ưu tiên kế hoạch tương ứng.

## Đọc Đại vận không cực đoan

Một đại vận có thách thức không có nghĩa là xấu hoàn toàn. Nó có thể là giai đoạn rèn kỹ năng, thay đổi chiến lược và xây nền bền hơn.

${cta}`,
  }),
  article({
    title: "Nguyệt vận và Nhật vận: Cách dùng cho kế hoạch tháng, ngày",
    slug: "nguyet-van-nhat-van",
    excerpt: "Nguyệt vận giúp xem nhịp tháng, Nhật vận giúp chọn việc nên làm và nên tránh trong từng ngày.",
    focusKeyword: "nguyệt vận nhật vận",
    coverImage: "/articles/nguyet-nhat-van.svg",
    coverAlt: "Lịch nguyệt vận và nhật vận tử vi",
    metaTitle: "Nguyệt vận và Nhật vận trong tử vi: Kế hoạch tháng, ngày",
    metaDescription: "Phân biệt Nguyệt vận và Nhật vận, cách ứng dụng để lập kế hoạch tháng, chọn ngày và quản trị rủi ro cá nhân.",
    canonicalUrl: "/kien-thuc-tu-vi/nguyet-van-nhat-van",
    date: "2026-05-18",
    content: `Nguyệt vận và Nhật vận là hai lớp thời gian ngắn. Nếu Đại vận giống bản đồ đường dài, Nguyệt vận và Nhật vận giống lịch điều chỉnh nhịp hành động.

## Dùng Nguyệt vận để lập kế hoạch

Nguyệt vận phù hợp cho việc chọn trọng tâm tháng: học tập, tài chính, quan hệ, sức khỏe hay xử lý việc tồn đọng.

## Dùng Nhật vận để chọn nhịp trong ngày

Nhật vận nên dùng như gợi ý nhẹ: việc nào nên ưu tiên, việc nào nên kiểm tra kỹ, khung giờ nào phù hợp để làm việc cần sự tập trung.

${cta}`,
  }),
  article({
    title: "Giờ sinh trong tử vi: Vì sao cần chọn đúng giờ?",
    slug: "gio-sinh-trong-tu-vi",
    excerpt: "Giờ sinh ảnh hưởng trực tiếp đến Cung Mệnh, Cung Thân và cách an sao. Tìm hiểu cách chọn giờ sinh tử vi dễ hiểu cho người mới.",
    focusKeyword: "giờ sinh tử vi",
    coverImage: "/articles/gio-sinh-tu-vi.svg",
    coverAlt: "Đồng hồ can chi minh họa giờ sinh trong tử vi",
    metaTitle: "Giờ sinh tử vi: Cách chọn đúng giờ khi lập lá số",
    metaDescription: "Tìm hiểu vì sao giờ sinh tử vi quan trọng, cách chọn giờ Tý Sửu Dần Mão và lưu ý khi không nhớ chính xác giờ sinh.",
    canonicalUrl: "/kien-thuc-tu-vi/gio-sinh-trong-tu-vi",
    date: "2026-05-22",
    faqs: [
      {
        question: "Không nhớ chính xác giờ sinh thì có lập lá số tử vi được không?",
        answer: "Vẫn có thể lập để tham khảo, nhưng độ chính xác giảm vì giờ sinh ảnh hưởng đến Cung Mệnh, Cung Thân và một số sao quan trọng.",
      },
      {
        question: "Giờ Tý trong tử vi tính từ mấy giờ?",
        answer: "Theo quy ước phổ thông, giờ Tý thường tính từ 23h đến 00h59. Khi nhập lá số nên chọn đúng khung giờ sinh thay vì nhập phút quá chi tiết.",
      },
    ],
    content: `Giờ sinh tử vi là dữ liệu rất quan trọng khi lập lá số. Cùng một ngày, tháng, năm sinh nhưng khác giờ sinh thì vị trí Cung Mệnh, Cung Thân và nhiều sao có thể thay đổi. Vì vậy, nếu muốn đọc lá số rõ hơn, bạn nên chọn đúng khung giờ sinh trước khi xem luận giải.

## Giờ sinh ảnh hưởng đến phần nào?

Trong tử vi, một ngày được chia thành 12 giờ địa chi: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi. Mỗi giờ kéo dài khoảng hai tiếng. Khi lập lá số, giờ sinh tham gia vào cách xác định Cung Mệnh, Cung Thân, cục mệnh và nhịp an sao.

Nếu giờ sinh sai, phần luận về tính cách, hướng hành động và vận hạn có thể lệch. Ví dụ, một người sinh vào cuối giờ Sửu nhưng nhập nhầm sang giờ Dần có thể làm thay đổi trọng tâm đọc cung và sao.

## Không nhớ giờ sinh thì nên làm gì?

Nếu không nhớ chính xác, bạn có thể hỏi lại giấy khai sinh, người thân hoặc chọn khung giờ gần nhất mà gia đình nhớ được. Trường hợp chỉ biết buổi sáng, trưa, chiều hoặc tối, nên lập thử vài lá số gần nhau rồi so sánh với các dấu hiệu đời sống đã xảy ra.

Cách này không thay thế dữ liệu gốc, nhưng giúp bạn có thêm cơ sở. Khi đọc luận giải, hãy xem đó là bản tham khảo và chú ý những điểm trùng khớp rõ nhất.

## Có cần nhập phút sinh không?

Với nhu cầu phổ thông, chỉ cần chọn khung giờ sinh theo 12 giờ địa chi. Phút sinh thường không cần thiết nếu hệ thống đang dùng chuẩn tử vi Việt Nam phổ thông. Điều quan trọng là chọn đúng khoảng giờ: Tý 23h-00h59, Sửu 01h-02h59, Dần 03h-04h59 và tiếp tục như vậy.

Bạn có thể bắt đầu bằng [lập lá số tử vi miễn phí](/#lap-la-so), sau đó đọc thêm [Cung Mệnh và Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than) để hiểu vì sao giờ sinh tác động mạnh đến bản đồ tử vi.

${cta}`,
  }),
  article({
    title: "Chính tinh trong tử vi: 14 sao chính nên biết",
    slug: "sao-chinh-tinh-tu-vi",
    excerpt: "Tổng quan 14 chính tinh trong tử vi và cách đọc sao chính theo cung, trạng thái Miếu Vượng Đắc Bình Hãm.",
    focusKeyword: "chính tinh tử vi",
    coverImage: "/articles/chinh-tinh-tu-vi.svg",
    coverAlt: "Mười bốn chính tinh tử vi trên bàn lá số",
    metaTitle: "Chính tinh tử vi: 14 sao chính và cách đọc dễ hiểu",
    metaDescription: "Tìm hiểu 14 chính tinh tử vi, ý nghĩa sao chính trong cung và vì sao trạng thái Miếu Vượng Đắc Hãm rất quan trọng.",
    canonicalUrl: "/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi",
    date: "2026-05-23",
    faqs: [
      {
        question: "Chính tinh trong tử vi là gì?",
        answer: "Chính tinh là nhóm sao lớn làm trục chính khi đọc cung. Chúng cần được xem cùng cung vị, phụ tinh, trạng thái sao và vận hạn.",
      },
      {
        question: "Một sao hãm có phải luôn xấu không?",
        answer: "Không. Sao hãm là tín hiệu cần cẩn trọng hơn, nhưng vẫn phải đọc cùng toàn bộ cung, các sao hỗ trợ và hoàn cảnh thực tế.",
      },
    ],
    content: `Chính tinh tử vi là nhóm sao chính tạo nên sắc thái lớn của từng cung. Khi nhìn một lá số, người đọc thường bắt đầu từ Cung Mệnh, Cung Thân và các chính tinh đi cùng. Tuy vậy, không nên chỉ nhìn tên sao rồi kết luận ngay, vì một sao còn phải xét cung, trạng thái và các sao đi kèm.

## 14 chính tinh thường gặp

Nhóm 14 chính tinh gồm Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát và Phá Quân. Mỗi sao có khí chất riêng, nhưng ý nghĩa sẽ thay đổi khi nằm ở cung khác nhau.

Ví dụ, một sao thiên về quản lý khi vào Cung Quan Lộc có thể nói nhiều về trách nhiệm và công việc. Khi vào Cung Tài Bạch, nó lại nghiêng về cách kiếm tiền, quản lý nguồn lực và ra quyết định tài chính.

## Vì sao trạng thái sao quan trọng?

Trạng thái Miếu, Vượng, Đắc, Bình, Hãm giúp hiểu sao đó đang phát huy mạnh hay yếu. Cùng một sao nhưng ở trạng thái tốt có thể biểu hiện rõ ràng, ổn định hơn. Ở trạng thái hãm, sao vẫn có giá trị nhưng cần đọc thận trọng, xem như tín hiệu cần quản trị rủi ro.

Đây là lý do khi xem lá số, bạn nên ưu tiên hệ thống có hiển thị trạng thái sao sát cạnh tên sao. Nếu thiếu phần này, luận giải dễ bị chung chung và bỏ qua một lớp dữ liệu quan trọng.

## Đọc chính tinh thế nào cho dễ hiểu?

Người mới nên đọc theo thứ tự: Cung Mệnh, Cung Thân, Cung Quan Lộc, Cung Tài Bạch, Cung Phu Thê và Cung Tật Ách. Ở mỗi cung, hãy nhìn chính tinh trước, sau đó mới xét phụ tinh, sao lưu và vận hạn.

Bạn có thể xem thêm bài [12 cung trong lá số tử vi](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi) và [Đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi) để hiểu cách ghép sao với từng lớp thời gian.

${cta}`,
  }),
  article({
    title: "Tuần Triệt trong lá số tử vi: Hiểu đúng để không lo quá",
    slug: "tuan-triet-trong-la-so-tu-vi",
    excerpt: "Tuần và Triệt thường khiến người mới lo lắng. Bài viết giải thích cách hiểu Tuần Triệt theo hướng cân bằng, dễ ứng dụng.",
    focusKeyword: "tuần triệt tử vi",
    coverImage: "/articles/tuan-triet-tu-vi.svg",
    coverAlt: "Ký hiệu Tuần Triệt trên lá số tử vi",
    metaTitle: "Tuần Triệt tử vi: Ý nghĩa và cách đọc cân bằng",
    metaDescription: "Giải thích Tuần Triệt trong lá số tử vi, cách đọc ảnh hưởng đến cung sao và vì sao không nên lo lắng cực đoan.",
    canonicalUrl: "/kien-thuc-tu-vi/tuan-triet-trong-la-so-tu-vi",
    date: "2026-05-24",
    faqs: [
      {
        question: "Tuần Triệt có phải luôn xấu không?",
        answer: "Không. Tuần Triệt thường cho thấy sự chậm, ngăn, đổi hướng hoặc cần rèn luyện thêm. Cần đọc cùng toàn bộ cung và vận hạn.",
      },
      {
        question: "Có nên sợ khi Cung Mệnh gặp Tuần Triệt?",
        answer: "Không nên sợ. Đây là tín hiệu cần hiểu cách phát triển phù hợp hơn, không phải kết luận cố định về cuộc đời.",
      },
    ],
    content: `Tuần Triệt tử vi là một trong những phần dễ khiến người mới lo lắng. Nhiều người thấy Cung Mệnh, Quan Lộc hoặc Tài Bạch gặp Tuần Triệt thì vội nghĩ là xấu. Cách hiểu như vậy quá đơn giản và dễ gây áp lực không cần thiết.

## Tuần Triệt nên hiểu thế nào?

Tuần và Triệt thường được xem như yếu tố làm chậm, làm giảm, chặn bớt hoặc buộc một cung phải đi qua quá trình điều chỉnh. Nhưng điều này không đồng nghĩa với thất bại. Trong nhiều trường hợp, nó khiến người xem phải đi chắc hơn, học kỹ hơn và không thể nóng vội.

Khi đọc Tuần Triệt, cần xem cung nào bị ảnh hưởng, sao chính ở cung đó là gì, trạng thái sao ra sao và vận hạn hiện tại có kích hoạt cung đó không.

## Vì sao không nên kết luận cực đoan?

Một cung gặp Tuần Triệt nhưng có sao tốt, vận phù hợp và người đó biết cách hành động vẫn có thể phát triển tốt. Ngược lại, cung không gặp Tuần Triệt nhưng thiếu kỷ luật, thiếu kế hoạch thì kết quả thực tế vẫn không bền.

Tử vi nên giúp người đọc hiểu nhịp đi của mình, không phải làm họ sợ. Vì vậy, khi gặp Tuần Triệt, hãy xem đây là lời nhắc: chậm lại, kiểm tra kỹ, học đủ nền tảng và chọn thời điểm hợp lý.

## Nên đọc cùng những phần nào?

Tuần Triệt nên được đọc cùng [Cung Mệnh và Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than), [Cung Quan Lộc](/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi) và [Đại vận](/kien-thuc-tu-vi/dai-van-la-gi). Khi ghép nhiều lớp, lời luận sẽ thực tế hơn rất nhiều.

${cta}`,
  }),
  article({
    title: "Xem ngày tốt xấu theo tuổi: Nên hiểu như công cụ hỗ trợ",
    slug: "xem-ngay-tot-xau-theo-tuoi",
    excerpt: "Xem ngày tốt xấu theo tuổi nên kết hợp trực, hoàng đạo hắc đạo, nhị thập bát tú, can chi xung hợp và mục đích công việc.",
    focusKeyword: "xem ngày tốt xấu theo tuổi",
    coverImage: "/articles/xem-ngay-tot-xau.svg",
    coverAlt: "Lịch xem ngày tốt xấu theo tuổi và loại việc",
    metaTitle: "Xem ngày tốt xấu theo tuổi: Cách hiểu dễ ứng dụng",
    metaDescription: "Hướng dẫn xem ngày tốt xấu theo tuổi bằng trực, hoàng đạo hắc đạo, nhị thập bát tú, can chi xung hợp và loại việc.",
    canonicalUrl: "/kien-thuc-tu-vi/xem-ngay-tot-xau-theo-tuoi",
    date: "2026-05-25",
    faqs: [
      {
        question: "Xem ngày tốt xấu có cần tuổi cá nhân không?",
        answer: "Có. Một ngày tốt chung vẫn cần đối chiếu với tuổi, can chi và loại việc để lời khuyên sát hơn.",
      },
      {
        question: "Có nên quyết định việc lớn chỉ dựa vào ngày tốt không?",
        answer: "Không nên. Ngày tốt chỉ là một lớp tham khảo, cần kết hợp điều kiện thực tế, tài chính, sức khỏe và sự chuẩn bị.",
      },
    ],
    content: `Xem ngày tốt xấu theo tuổi là nhu cầu phổ biến khi chuẩn bị cưới hỏi, khai trương, ký hợp đồng, xuất hành hoặc bắt đầu việc quan trọng. Tuy nhiên, ngày tốt nên được hiểu như công cụ hỗ trợ ra quyết định, không phải yếu tố quyết định tất cả.

## Một ngày tốt cần xét những gì?

Một hệ thống xem ngày có nền tảng nên xét nhiều lớp: 12 trực, ngày hoàng đạo hay hắc đạo, nhị thập bát tú, can chi ngày tháng năm, xung hợp với tuổi cá nhân, sao tốt xấu và loại việc cụ thể. Một ngày có thể hợp cho xuất hành nhưng chưa chắc hợp để ký hợp đồng hoặc cưới hỏi.

Vì vậy, nếu chỉ nhìn một nhãn "ngày tốt" hoặc "ngày xấu" thì thông tin còn quá ít. Người dùng nên đọc thêm phần việc nên làm, việc nên tránh và lý do đằng sau kết luận.

## Kết hợp với lá số cá nhân

Khi đã có lá số cá nhân, phần xem ngày có thể sát hơn vì hệ thống biết năm sinh, tuổi âm, cung mệnh và nhịp vận hiện tại. Điều này giúp lời khuyên bớt chung chung, nhất là với các việc liên quan đến tiền bạc, công việc hoặc quan hệ gia đình.

Bạn có thể thử [xem ngày](/xem-ngay), rồi đối chiếu thêm với [Nguyệt vận và Nhật vận](/kien-thuc-tu-vi/nguyet-van-nhat-van) để hiểu nhịp tháng, nhịp ngày theo từng lớp thời gian.

## Dùng sao cho tỉnh táo?

Ngày tốt chỉ phát huy khi bạn đã chuẩn bị đủ: giấy tờ rõ, tài chính ổn, sức khỏe phù hợp và người liên quan cùng thống nhất. Nếu điều kiện thực tế chưa đủ, chọn ngày đẹp cũng không thay thế được sự chuẩn bị.

${cta}`,
  }),
  article({
    title: "SEO cho website tử vi: Topic cluster, backlink và schema",
    slug: "seo-cho-website-tu-vi",
    excerpt: "Cách xây nền SEO cho website tử vi: chọn cụm chủ đề, viết bài evergreen, đặt internal link, outbound reference và schema Article.",
    focusKeyword: "seo website tử vi",
    coverImage: "/articles/seo-tu-vi.svg",
    coverAlt: "Sơ đồ SEO website tử vi với keyword, schema và backlink",
    metaTitle: "SEO website tử vi: Topic cluster, backlink và schema",
    metaDescription: "Hướng dẫn SEO website tử vi bằng topic cluster, bài evergreen, internal link, outbound reference, schema Article và tối ưu trải nghiệm đọc.",
    canonicalUrl: "/kien-thuc-tu-vi/seo-cho-website-tu-vi",
    date: "2026-05-20",
    content: `SEO website tử vi cần cân bằng giữa nội dung dễ hiểu, cấu trúc kỹ thuật và độ tin cậy. Một bài viết tốt không chỉ nhồi từ khóa "tử vi", mà phải trả lời đúng ý định tìm kiếm của người đọc: muốn lập lá số, hiểu cung Mệnh, xem ngày, hay tra vận hạn.

## Xây topic cluster trước khi viết bài

Hãy xem trang [lập lá số tử vi](/#lap-la-so) là trang chuyển đổi chính. Từ đó, các bài kiến thức nên tạo thành cụm chủ đề: [12 cung tử vi](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi), [Cung Mệnh và Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than), [Đại vận](/kien-thuc-tu-vi/dai-van-la-gi), [Nguyệt vận và Nhật vận](/kien-thuc-tu-vi/nguyet-van-nhat-van). Mỗi bài cần trỏ về trang lập lá số và trỏ qua bài liên quan để tăng topical authority.

## Tối ưu on-page cho bài viết tử vi

Một bài SEO cơ bản nên có H1 duy nhất, ít nhất hai H2, meta title khoảng 35-60 ký tự, meta description khoảng 120-160 ký tự, ảnh minh họa có alt text và canonical URL. Phần đầu bài nên nhắc tự nhiên focus keyword để người đọc và công cụ tìm kiếm hiểu chủ đề chính.

## Backlink và outbound reference

Backlink chất lượng thường đến từ nội dung hữu ích, có dữ liệu, có hình minh họa, có cấu trúc rõ và có quan điểm biên tập đáng tin. Với bài tử vi, có thể tạo tài nguyên evergreen như bảng 12 cung, glossary sao chính tinh, hướng dẫn đọc lá số cho người mới. Khi dẫn nguồn ngoài, nên trỏ tới tài liệu chính thống như [Google Search Central SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) hoặc [Schema.org Article](https://schema.org/Article), tránh link tới site kém tin cậy.

## Schema và tốc độ

Trang bài viết nên có JSON-LD Article, BreadcrumbList, ảnh OG, sitemap và robots rõ ràng. Về tốc độ, hãy dùng ảnh tối ưu, nội dung tĩnh có revalidate, tránh nhúng script nặng, và ưu tiên HTML đọc được ngay thay vì render toàn bộ bằng JavaScript.

${cta}`,
  }),
  article({
    title: "Lá số tử vi là gì? Cách hiểu đúng trước khi xem luận giải",
    slug: "la-so-tu-vi-la-gi",
    excerpt: "Lá số tử vi là bản đồ 12 cung được lập từ ngày, tháng, năm, giờ sinh. Bài viết giúp người mới hiểu lá số dùng để làm gì và nên đọc theo thứ tự nào.",
    focusKeyword: "lá số tử vi là gì",
    coverImage: "/articles/la-so-12-cung.svg",
    coverAlt: "Minh họa bàn lá số tử vi 12 cung cho người mới",
    metaTitle: "Lá số tử vi là gì? Hướng dẫn dễ hiểu cho người mới",
    metaDescription: "Tìm hiểu lá số tử vi là gì, gồm những phần nào, vì sao cần giờ sinh và cách đọc lá số tử vi theo thứ tự dễ hiểu cho người mới bắt đầu.",
    canonicalUrl: "/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
    date: "2026-06-01",
    faqs: [
      {
        question: "Lá số tử vi có phải là kết luận cố định về cuộc đời không?",
        answer: "Không. Lá số tử vi nên được xem như bản đồ tham khảo về xu hướng tính cách, nhịp vận và điểm cần lưu ý. Kết quả thực tế vẫn phụ thuộc vào lựa chọn, môi trường và sự chuẩn bị của mỗi người.",
      },
      {
        question: "Muốn lập lá số tử vi cần những thông tin gì?",
        answer: "Thông tin cơ bản gồm họ tên, giới tính, ngày tháng năm sinh, giờ sinh theo 12 giờ địa chi và năm muốn xem. Giờ sinh càng đúng thì vị trí cung và sao càng đáng tin hơn.",
      },
    ],
    content: `Lá số tử vi là bản đồ gồm 12 cung, được lập từ ngày, tháng, năm và giờ sinh của một người. Mỗi cung phản ánh một mảng đời sống như bản thân, công việc, tiền bạc, hôn nhân, gia đình, sức khỏe, quan hệ và vận hạn. Khi đọc đúng cách, lá số không nhằm làm người xem lo sợ, mà giúp họ hiểu mình hơn và chuẩn bị tốt hơn.

## Lá số tử vi gồm những phần chính nào?

Một lá số cơ bản thường có Cung Mệnh, Cung Thân, 12 cung, chính tinh, phụ tinh, vòng trường sinh, đại vận, tiểu vận, nguyệt vận và nhật vận. Người mới không cần đọc tất cả cùng lúc. Hãy bắt đầu từ các phần dễ hiểu nhất: [Cung Mệnh và Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than), sau đó đọc [12 cung trong lá số tử vi](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi).

## Lá số dùng để làm gì?

Lá số giúp nhìn xu hướng. Ví dụ, Cung Quan Lộc liên quan đến công việc, Cung Tài Bạch liên quan đến tiền bạc, Cung Phu Thê liên quan đến hôn nhân và cách đồng hành. Khi ghép các cung với đại vận hoặc năm đang xem, người đọc có thể hiểu giai đoạn nào nên mở rộng, giai đoạn nào nên thận trọng.

## Người mới nên đọc theo thứ tự nào?

Thứ tự dễ nhất là: Mệnh và Thân, sau đó Quan Lộc, Tài Bạch, Phu Thê, Tật Ách và Thiên Di. Khi đã quen, bạn có thể đọc thêm [Đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi), [Nguyệt vận và Nhật vận](/kien-thuc-tu-vi/nguyet-van-nhat-van), rồi dùng công cụ [xem ngày](/xem-ngay) cho các việc cụ thể.

## Lưu ý khi xem luận giải

Một lời luận tốt nên nói rõ dữ liệu nào đang được dùng: cung nào, sao nào, trạng thái sao ra sao, vận hạn nào đang kích hoạt. Nếu lời luận chỉ nói chung chung, không bám vào lá số, người đọc rất khó ứng dụng.

${cta}`,
  }),
  article({
    title: "Cách đọc lá số tử vi cho người mới: 7 bước dễ theo dõi",
    slug: "cach-doc-la-so-tu-vi-cho-nguoi-moi",
    excerpt: "Hướng dẫn 7 bước đọc lá số tử vi cho người mới: xem Mệnh Thân, 12 cung, chính tinh, trạng thái sao, đại vận và vận năm.",
    focusKeyword: "cách đọc lá số tử vi",
    coverImage: "/articles/chinh-tinh-tu-vi.svg",
    coverAlt: "Các bước đọc lá số tử vi từ cung mệnh đến vận hạn",
    metaTitle: "Cách đọc lá số tử vi cho người mới: 7 bước dễ hiểu",
    metaDescription: "Hướng dẫn cách đọc lá số tử vi cho người mới theo 7 bước: Mệnh Thân, 12 cung, chính tinh, phụ tinh, trạng thái sao, đại vận và vận năm.",
    canonicalUrl: "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi",
    date: "2026-06-02",
    faqs: [
      {
        question: "Người mới nên đọc cung nào đầu tiên?",
        answer: "Nên bắt đầu từ Cung Mệnh và Cung Thân, sau đó đọc Quan Lộc, Tài Bạch, Phu Thê, Tật Ách và Thiên Di để có bức tranh thực tế hơn.",
      },
      {
        question: "Có nên chỉ đọc sao chính trong lá số không?",
        answer: "Không nên. Sao chính là trục quan trọng, nhưng cần đọc cùng trạng thái Miếu Vượng Đắc Bình Hãm, phụ tinh, cung vị và vận hạn.",
      },
    ],
    content: `Cách đọc lá số tử vi cho người mới nên đi từ tổng quan đến chi tiết. Nếu đọc ngay từng sao nhỏ, bạn rất dễ rối và khó biết phần nào quan trọng. Một quy trình rõ ràng sẽ giúp lời luận dễ hiểu hơn, đặc biệt với người mới lập lá số lần đầu.

## Bước 1: Kiểm tra thông tin sinh

Trước tiên cần kiểm tra ngày sinh, lịch sinh, giờ sinh và giới tính. Nếu giờ sinh sai, vị trí Cung Mệnh, Cung Thân và một số sao có thể thay đổi. Bạn có thể đọc thêm bài [giờ sinh trong tử vi](/kien-thuc-tu-vi/gio-sinh-trong-tu-vi) để hiểu vì sao phần này quan trọng.

## Bước 2: Đọc Cung Mệnh và Cung Thân

Cung Mệnh cho biết nền khí chất, còn Cung Thân phản ánh cách một người nhập cuộc khi trưởng thành. Đây là hai trục nên đọc trước khi đi vào tiền bạc, công việc hay hôn nhân.

## Bước 3: Đọc các cung đời sống chính

Sau Mệnh và Thân, hãy đọc Quan Lộc, Tài Bạch, Phu Thê, Tật Ách và Thiên Di. Các bài liên quan gồm [Cung Tài Bạch](/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi), [Cung Quan Lộc](/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi), [Cung Phu Thê](/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi), [Cung Tật Ách](/kien-thuc-tu-vi/cung-tat-ach-trong-tu-vi) và [Cung Thiên Di](/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi).

## Bước 4: Xem chính tinh và trạng thái sao

Tên sao chưa đủ. Cần xem sao đó đang Miếu, Vượng, Đắc, Bình hay Hãm. Trạng thái sao giúp biết năng lượng đang thuận, mạnh, trung bình hay cần thận trọng. Đây là lý do bài [chính tinh trong tử vi](/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi) rất nên đọc sau khi hiểu 12 cung.

## Bước 5: Ghép với vận hạn

Lá số gốc giống nền tảng, còn [Đại vận](/kien-thuc-tu-vi/dai-van-la-gi), tiểu vận, nguyệt vận và nhật vận cho biết nhịp thời gian. Khi ghép đúng, lời luận sẽ bớt chung chung và sát giai đoạn hiện tại hơn.

${cta}`,
  }),
  article({
    title: "Cung Phu Thê trong tử vi: Cách đọc hôn nhân và người đồng hành",
    slug: "cung-phu-the-trong-tu-vi",
    excerpt: "Cung Phu Thê phản ánh xu hướng hôn nhân, cách chọn người đồng hành, bài học trong quan hệ và điều cần lưu ý khi đọc lá số.",
    focusKeyword: "cung phu thê",
    coverImage: "/articles/cung-menh-than.svg",
    coverAlt: "Minh họa cung Phu Thê trong lá số tử vi",
    metaTitle: "Cung Phu Thê trong tử vi: Hôn nhân và người đồng hành",
    metaDescription: "Tìm hiểu Cung Phu Thê trong tử vi, cách đọc xu hướng hôn nhân, người đồng hành, bài học trong quan hệ và cách ứng dụng cân bằng.",
    canonicalUrl: "/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi",
    date: "2026-06-03",
    content: `Cung Phu Thê trong tử vi thường được quan tâm vì liên quan đến hôn nhân, người đồng hành và cách một người xây dựng quan hệ lâu dài. Tuy vậy, cung này không nên dùng để kết luận cứng về việc "tốt" hay "xấu" trong tình cảm.

## Cung Phu Thê cho biết điều gì?

Cung Phu Thê phản ánh kiểu kết nối, tiêu chuẩn chọn bạn đời, bài học trong quan hệ và những điểm cần học để đồng hành bền hơn. Khi đọc cung này, cần xem chính tinh, phụ tinh, trạng thái sao, Tuần Triệt nếu có, đồng thời đối chiếu với Cung Mệnh và Cung Thân.

## Không nên đọc Cung Phu Thê một mình

Một cung Phu Thê có tín hiệu thử thách không có nghĩa là hôn nhân xấu. Nó có thể cho thấy người đó cần học cách giao tiếp, đặt ranh giới, trưởng thành cảm xúc hoặc chọn thời điểm phù hợp. Ngược lại, cung có nhiều sao thuận vẫn cần sự tỉnh táo và trách nhiệm trong đời sống thật.

## Nên đọc cùng những bài nào?

Để hiểu đầy đủ, bạn nên đọc cùng [Cung Mệnh và Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than), [12 cung trong lá số tử vi](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi) và [Đại vận là gì](/kien-thuc-tu-vi/dai-van-la-gi). Khi có lá số cá nhân, phần luận giải sẽ chỉ ra cung Phu Thê đang chịu ảnh hưởng của vận nào.

${cta}`,
  }),
  article({
    title: "Cung Tật Ách trong tử vi: Đọc sức khỏe và điểm cần lưu ý",
    slug: "cung-tat-ach-trong-tu-vi",
    excerpt: "Cung Tật Ách giúp nhận diện xu hướng sức khỏe, áp lực tinh thần, thói quen cần điều chỉnh và cách đọc sao theo hướng chủ động.",
    focusKeyword: "cung tật ách",
    coverImage: "/articles/nguyet-nhat-van.svg",
    coverAlt: "Minh họa cung Tật Ách và các lưu ý sức khỏe trong tử vi",
    metaTitle: "Cung Tật Ách trong tử vi: Sức khỏe và điều cần lưu ý",
    metaDescription: "Tìm hiểu Cung Tật Ách trong tử vi, cách đọc xu hướng sức khỏe, áp lực tinh thần và các lưu ý thực tế khi xem lá số cá nhân.",
    canonicalUrl: "/kien-thuc-tu-vi/cung-tat-ach-trong-tu-vi",
    date: "2026-06-04",
    faqs: [
      {
        question: "Cung Tật Ách có thay thế tư vấn y khoa không?",
        answer: "Không. Cung Tật Ách chỉ là lớp tham khảo về xu hướng và thói quen cần lưu ý. Khi có vấn đề sức khỏe, cần ưu tiên bác sĩ và chuyên gia y tế.",
      },
    ],
    content: `Cung Tật Ách trong tử vi liên quan đến sức khỏe, áp lực tinh thần, thói quen sinh hoạt và những điểm cần thận trọng. Đây là cung nên đọc với thái độ bình tĩnh, tránh tự hù dọa bản thân bằng các kết luận cực đoan.

## Cung Tật Ách nên được hiểu thế nào?

Cung Tật Ách không phải bản chẩn đoán y khoa. Nó là tín hiệu để người xem chú ý hơn đến cách nghỉ ngơi, làm việc, quản trị căng thẳng và phòng ngừa rủi ro. Nếu cung này có nhiều sao khó, lời khuyên thực tế thường là kiểm tra sức khỏe định kỳ, ngủ đủ, giảm quá tải và tránh chủ quan.

## Đọc cùng vận hạn hiện tại

Một dấu hiệu ở Cung Tật Ách sẽ quan trọng hơn khi vận hạn hiện tại kích hoạt cung này. Vì vậy, cần đọc cùng [Đại vận](/kien-thuc-tu-vi/dai-van-la-gi), [Nguyệt vận và Nhật vận](/kien-thuc-tu-vi/nguyet-van-nhat-van), đồng thời đối chiếu với tình trạng thực tế.

## Lời khuyên khi xem Cung Tật Ách

Hãy dùng phần luận giải như lời nhắc để chăm sóc bản thân. Tử vi có thể giúp bạn nhận diện giai đoạn nên giảm tốc, nhưng không nên thay thế khám chữa bệnh hoặc tư vấn chuyên môn.

${cta}`,
  }),
  article({
    title: "Cung Thiên Di trong tử vi: Ra ngoài, giao tiếp và cơ hội bên ngoài",
    slug: "cung-thien-di-trong-tu-vi",
    excerpt: "Cung Thiên Di cho biết cách một người bước ra bên ngoài, giao tiếp xã hội, đi xa, gặp cơ hội và xử lý môi trường lạ.",
    focusKeyword: "cung thiên di",
    coverImage: "/articles/xem-ngay-tot-xau.svg",
    coverAlt: "Minh họa cung Thiên Di trong tử vi và cơ hội khi ra ngoài",
    metaTitle: "Cung Thiên Di trong tử vi: Giao tiếp, đi xa và cơ hội",
    metaDescription: "Tìm hiểu Cung Thiên Di trong tử vi, cách đọc khả năng giao tiếp, đi xa, cơ hội bên ngoài và những điều cần lưu ý khi nhập cuộc xã hội.",
    canonicalUrl: "/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi",
    date: "2026-06-05",
    content: `Cung Thiên Di trong tử vi phản ánh cách một người bước ra bên ngoài: giao tiếp, gặp người lạ, di chuyển, đi xa, làm việc với môi trường mới và nắm bắt cơ hội ngoài phạm vi quen thuộc.

## Cung Thiên Di cho biết điều gì?

Thiên Di không chỉ nói về đi xa. Nó còn nói về hình ảnh xã hội, khả năng thích nghi, cách người khác nhìn nhận bạn và những cơ hội xuất hiện khi bạn rời khỏi vùng quen thuộc. Người có Thiên Di thuận thường dễ gặp cơ hội khi giao tiếp, học hỏi hoặc mở rộng môi trường.

## Khi nào Thiên Di cần thận trọng?

Nếu Cung Thiên Di có sát tinh, sao hãm hoặc bị vận hạn kích hoạt mạnh, lời khuyên không phải là tránh ra ngoài hoàn toàn. Thay vào đó, nên chuẩn bị kỹ hơn: kiểm tra thông tin, tránh vội tin người lạ, quản trị rủi ro khi đi xa và giữ kỷ luật trong giao tiếp.

## Đọc Thiên Di cùng cung nào?

Thiên Di nên đọc cùng [Cung Mệnh và Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than), [Cung Quan Lộc](/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi) và [Cung Tài Bạch](/kien-thuc-tu-vi/cung-tai-bach-trong-tu-vi). Nếu bạn đang chọn ngày đi xa, có thể kết hợp thêm công cụ [xem ngày](/xem-ngay).

${cta}`,
  }),
];

export function articleWithScore(article: ArticleView): ArticleView {
  const seo = scoreArticleSeo({
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    focusKeyword: article.focusKeyword || undefined,
    metaTitle: article.metaTitle || undefined,
    metaDescription: article.metaDescription || undefined,
    coverAlt: article.coverAlt || undefined,
    canonicalUrl: article.canonicalUrl || undefined,
    schemaType: article.schemaType || undefined,
  });
  return { ...article, seoScore: article.seoScore ?? seo.score, seoChecklist: article.seoChecklist ?? seo.checks };
}
