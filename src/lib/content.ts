import { scoreArticleSeo } from "@/lib/seo";

export type ArticleView = {
  id: string;
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
  seoScore?: number;
  seoChecklist?: unknown;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
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
