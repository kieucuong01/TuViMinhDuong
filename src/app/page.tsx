import { BookOpenText, Brain, CheckCircle2, Compass, Eye, History, Layers3, MessageCircle, ShieldCheck, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ChartForm } from "@/components/chart-form";
import { DayFortuneCard } from "@/components/day-fortune-card";
import { DeferredSocialProof } from "@/components/deferred-social-proof";
import { QuickReadingForm } from "@/components/quick-reading-form";
import { getOperationSettings, listArticles } from "@/lib/data";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, organizationJsonLd, webPageJsonLd, websiteJsonLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata = routeMetadata({
  title: "Lập lá số tử vi miễn phí",
  description: "Lập lá số tử vi miễn phí, xem lá số 12 cung, xem ngày tốt xấu và mở luận giải dễ hiểu khi muốn đọc sâu hơn.",
  path: "/",
  imageSubtitle: "Nhập ngày giờ sinh để xem lá số cơ bản ngay",
});

type HomeSearchParams = {
  chartError?: string;
  source?: string;
};

function chartFormErrorMessage(chartError?: string) {
  if (chartError === "timeout") {
    return "Lập lá số đang chậm bất thường. Bạn thử lại sau ít phút; nếu vẫn lỗi, hệ thống đã ghi nhận để kiểm tra kết nối dữ liệu.";
  }
  if (chartError === "failed") {
    return "Chưa lập được lá số trong lượt này. Bạn kiểm tra lại thông tin sinh rồi thử lại giúp mình nhé.";
  }
  if (chartError === "invalid") {
    return "Tên trên lá số chứa ký tự không phù hợp. Bạn nhập tên thật hoặc tên gọi ngắn gọn rồi thử lại nhé.";
  }
  if (chartError === "rate_limited") {
    return "Thiết bị này đã lập quá nhiều lá số trong vài phút. Bạn chờ một lúc rồi thử lại nhé.";
  }
  return "";
}

function safeHomeAdSource(params: HomeSearchParams) {
  return params.source === "date_finder" ? "date_finder" : "chart_form";
}

export default async function Home({ searchParams }: { searchParams?: Promise<HomeSearchParams> }) {
  const paramsPromise: Promise<HomeSearchParams> = searchParams ?? Promise.resolve({});
  const [params, articleList, operationSettings] = await Promise.all([paramsPromise, listArticles(), getOperationSettings()]);
  const articles = articleList.slice(0, 3);
  const showQuickReading = operationSettings.paymentsEnabled && operationSettings.paidReadingsEnabled;
  const chartErrorMessage = chartFormErrorMessage(params.chartError);
  const chartAdSource = safeHomeAdSource(params);
  const homeFaqs = [
    {
      question: "Lá số tinh hoa khác gì một trang xem bói nhanh?",
      answer: "Trang ưu tiên lập lá số rõ ràng, giải thích theo từng cung và giữ nội dung ở mức tham khảo thực tế. Các phần luận sâu được trình bày để người đọc tự đối chiếu, không phán tuyệt đối hay gieo lo lắng.",
    },
    {
      question: "Tôi có cần biết tử vi trước khi dùng không?",
      answer: "Không cần. Bạn có thể lập lá số miễn phí trước, đọc phần tổng quan, sau đó đi từng bài kiến thức ngắn như Cung Mệnh, Cung Thân, 12 cung, Đại vận và các cung đời sống.",
    },
    {
      question: "AI trong Lá số tinh hoa được dùng như thế nào?",
      answer: "AI được dùng để hỗ trợ diễn giải dễ đọc hơn từ dữ liệu lá số và cấu trúc luận giải. Nội dung vẫn được đặt trong khung cổ học, có cảnh báo tham khảo và tránh các kết luận cực đoan.",
    },
    {
      question: "Nên bắt đầu từ đâu để đọc lá số hiệu quả?",
      answer: "Hãy bắt đầu bằng lá số miễn phí, đọc Mệnh - Thân để hiểu nền người, rồi đọc Quan Lộc, Tài Bạch, Phu Thê, Phúc Đức, Điền Trạch và Đại vận theo nhu cầu hiện tại.",
    },
  ];
  const homePageLd = webPageJsonLd({
    name: "Lập lá số tử vi miễn phí",
    description: "Lập lá số tử vi, xem ngày tốt xấu và đọc kiến thức tử vi dễ hiểu cho người Việt Nam.",
    url: "/",
  });
  const readerComments = [
    {
      initial: "H",
      name: "Hồng Nhung",
      date: "23/5/2026",
      badge: "Đã mở luận cung",
      body: "Mình đọc phần tổng quan trước thấy dễ hiểu hơn hẳn, không bị ngợp như mấy bản lá số dài. Mở thêm cung Quan Lộc thì đúng trọng tâm công việc hiện tại.",
      adminReply: "Cảm ơn Nhung đã phản hồi. Nếu đang xem hướng công việc, bạn đọc thêm Tài Bạch và Đại vận hiện tại sẽ thấy bức tranh rõ hơn.",
    },
    {
      initial: "T",
      name: "Tuấn Minh",
      date: "22/5/2026",
      badge: "Xem trên điện thoại",
      body: "Điểm mình thích là đọc trên điện thoại khá gọn, từng phần tách rõ. Bản miễn phí đủ để biết nên đọc mục nào trước, không bị cảm giác phải quyết định khi chưa hiểu.",
    },
    {
      initial: "L",
      name: "Linh",
      date: "21/5/2026",
      badge: "Đã lưu lá số",
      body: "Mình lỡ nhập nhầm email lúc đầu, admin hỗ trợ tìm lại lá số khá nhanh. Luận giải không hù dọa, đọc kiểu định hướng nên dễ tiếp nhận.",
      adminReply: "Cảm ơn Linh. Bên mình luôn ưu tiên giữ nội dung ở mức tham khảo thực tế, không gieo lo lắng. Nếu cần tìm lại lá số, bạn cứ dùng đúng email đã lưu là được.",
    },
    {
      initial: "P",
      name: "Phương Anh",
      date: "19/5/2026",
      badge: "Đọc đại vận",
      body: "Phần Đại vận giúp mình hiểu vì sao vài năm gần đây cảm giác phải đổi cách làm việc. Không phải câu nào cũng tuyệt đối, nhưng có nhiều ý để tự soi lại.",
    },
    {
      initial: "K",
      name: "Khánh",
      date: "18/5/2026",
      badge: "Quay lại xem tiếp",
      body: "Lúc đầu chỉ định xem thử, nhưng phần miễn phí viết có cấu trúc nên mình đọc thêm bản đầy đủ. Có mục nên lưu ý khá sát với chuyện gia đình của mình.",
      adminReply: "Cảm ơn Khánh đã tin dùng. Khi đọc các mục gia đình, bạn nên đối chiếu thêm Phúc Đức, Phụ Mẫu và bối cảnh thực tế để có góc nhìn cân bằng hơn.",
    },
  ];

  return (
    <main>
      <script id="website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
      <script id="organization-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <script id="homepage-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageLd) }} />
      <script id="homepage-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(homeFaqs)) }} />
      <section className="hero-band">
        <div className="hero-shell mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
            <div id="lap-la-so" className="hero-form-card ring-1 ring-white/70">
              <div className="mb-5 text-center">
                <p className="eyebrow">Lập lá số miễn phí</p>
                <h1 className="text-balance text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">Lập lá số tử vi miễn phí</h1>
                <p className="mt-2 text-base font-medium text-stone-600">Nhập thông tin sinh bên dưới để xem lá số cơ bản ngay.</p>
                <div className="hero-value-strip" aria-label="Điểm mạnh của Lá số tinh hoa">
                  <span>
                    <strong>12 cung</strong>
                    <small>Bản đồ rõ để biết nên đọc phần nào trước.</small>
                  </span>
                  <span>
                    <strong>Dễ hiểu</strong>
                    <small>Luận giải viết cho người mới, không dùng thuật ngữ rối.</small>
                  </span>
                  <span>
                    <strong>Có lộ trình</strong>
                    <small>Từ lá số miễn phí đến cung, vận hạn và ngày tốt.</small>
                  </span>
                </div>
              </div>
              {chartErrorMessage ? (
                <p className="chart-form-error" role="status">
                  {chartErrorMessage}
                </p>
              ) : null}
              <ChartForm adSource={chartAdSource} />
              <div className="form-assurance">
                <span><ShieldCheck size={17} /> Không cần trả phí để lập lá số</span>
                <span><Eye size={17} /> Có bản đọc rõ trên điện thoại</span>
                <span><History size={17} /> Đăng nhập để lưu và xem lại</span>
              </div>
            </div>

            <div className="hero-proof-rail">
              <section className="hero-insight-preview" aria-label="Xem trước bản luận giải">
                <div className="hero-insight-copy">
                  <p className="eyebrow">Xem trước kết quả</p>
                  <h2>Không chỉ lập lá số, mà biết nên đọc gì trước</h2>
                  <p>Bản miễn phí mở ra cấu trúc 12 cung, phần tổng quan và gợi ý các chủ đề nên đọc tiếp theo.</p>
                </div>
                <div className="hero-orbit-preview" aria-hidden="true">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <span key={index} style={{ "--dot-index": index } as CSSProperties} />
                  ))}
                  <strong>12 cung</strong>
                </div>
                <div className="hero-insight-list">
                  <span>
                    <Layers3 size={18} />
                    <b>Ghép cung</b>
                    <small>Mệnh, Thân, Quan Lộc, Tài Bạch đọc theo cùng một bức tranh.</small>
                  </span>
                  <span>
                    <ShieldCheck size={18} />
                    <b>Không hù dọa</b>
                    <small>Luận giải theo hướng tham khảo, có điều kiện và có bối cảnh.</small>
                  </span>
                  <span>
                    <Compass size={18} />
                    <b>Có bước tiếp theo</b>
                    <small>Biết nên đọc cung nào, vận nào, bài nền nào sau khi có lá số.</small>
                  </span>
                </div>
                <Link href="#he-thong-luan-giai" className="btn btn-ghost">
                  Xem cách luận <Compass size={18} />
                </Link>
              </section>
              <DayFortuneCard />
            </div>
          </div>
        </div>
      </section>

      <section className="section home-preview-section" id="he-thong-luan-giai">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="editorial-preview-head">
            <p className="eyebrow">Hệ thống luận giải</p>
            <h2>AI hỗ trợ đọc lá số, <em>cổ học giữ phần lõi</em></h2>
            <p>Lá số tinh hoa không chỉ đưa ra một đoạn luận chung. Trang được thiết kế để người đọc đi từ lá số miễn phí, qua từng cung đời sống, rồi mới vào phần luận sâu khi thật sự cần.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="result-preview-panel">
              <div className="preview-tabs" aria-label="Các lớp đọc lá số">
                <span className="active">Lá số</span>
                <span>12 cung</span>
                <span>Đại vận</span>
                <span>Ngày tốt</span>
              </div>
              <div className="reading-preview-card">
                <div className="reading-preview-head">
                  <span><Brain size={22} /></span>
                  <div>
                    <strong>Luận giải có cấu trúc, không phán một câu rồi bỏ đó</strong>
                    <p>Mỗi phần đọc theo bối cảnh: Mệnh - Thân, cung đời sống, vận hạn hiện tại và việc người dùng đang quan tâm.</p>
                  </div>
                </div>
                <div className="reading-preview-bars" aria-hidden="true">
                  <i style={{ width: "94%" }} />
                  <i style={{ width: "78%" }} />
                  <i style={{ width: "66%" }} />
                </div>
                <div className="preview-item-grid">
                  <article>
                    <Layers3 size={22} />
                    <strong>Ghép cung</strong>
                    <p>Không đọc từng cung tách rời; Quan Lộc, Tài Bạch, Phúc Đức, Điền Trạch được nối với nhau.</p>
                  </article>
                  <article>
                    <ShieldCheck size={22} />
                    <strong>Giọng an toàn</strong>
                    <p>Tránh hù dọa, tránh kết luận cực đoan, giữ nội dung ở mức tham khảo có trách nhiệm.</p>
                  </article>
                  <article>
                    <Compass size={22} />
                    <strong>Hướng hành động</strong>
                    <p>Người đọc biết nên xem phần nào tiếp theo thay vì bị ngợp bởi toàn bộ lá số.</p>
                  </article>
                </div>
              </div>
            </div>

            <div className="journey-panel">
              <p className="eyebrow">Lộ trình đọc nhanh</p>
              <h3>Ba bước để không bị lạc trong lá số</h3>
              <div className="journey-steps">
                <article>
                  <b>1</b>
                  <div>
                    <strong>Lập lá số miễn phí</strong>
                    <p>Nhập ngày giờ sinh để có bản đồ 12 cung và phần tổng quan ban đầu.</p>
                  </div>
                </article>
                <article>
                  <b>2</b>
                  <div>
                    <strong>Đọc đúng cụm bài nền</strong>
                    <p>Bắt đầu từ Mệnh - Thân, 12 cung, Đại vận, rồi đi vào cung đang liên quan đến việc thật.</p>
                  </div>
                </article>
                <article>
                  <b>3</b>
                  <div>
                    <strong>Mở luận sâu khi cần</strong>
                    <p>Khi đã hiểu nền, phần luận sâu sẽ dễ đối chiếu hơn và ít bị cảm giác mơ hồ.</p>
                  </div>
                </article>
              </div>
              <div className="journey-note">
                <CheckCircle2 size={20} />
                <span>Tinh thần của trang là giúp đọc rõ hơn để tự quyết định tốt hơn, không thay bạn quyết định.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section reader-comments-section" id="binh-luan-doc-gia">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reader-comments-head">
            <div>
              <p className="eyebrow">Bình luận độc giả</p>
            </div>
            <Link href="#lap-la-so" className="btn btn-ghost">
              Lập lá số để xem thử <MessageCircle size={18} />
            </Link>
          </div>

          <div className="reader-comments-layout">
            <div className="reader-comment-list">
              {readerComments.map((comment) => (
                <article key={`${comment.name}-${comment.date}`} className="reader-comment-card">
                  <div className="reader-comment-avatar" aria-hidden="true">{comment.initial}</div>
                  <div className="reader-comment-body">
                    <header>
                      <strong>{comment.name}</strong>
                      <span>{comment.date}</span>
                      <em>{comment.badge}</em>
                    </header>
                    <p>{comment.body}</p>
                    {comment.adminReply ? (
                      <div className="reader-comment-reply">
                        <span className="reader-comment-avatar admin" aria-hidden="true">A</span>
                        <div>
                          <header>
                            <strong>LSTH Admin</strong>
                            <span>Đã phản hồi</span>
                          </header>
                          <p>{comment.adminReply}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="reader-comments-cta">
            <div>
              <strong>Muốn xem lá số của mình rõ như vậy?</strong>
              <span>Lập miễn phí trước, đọc tổng quan rồi đi tiếp vào phần bạn thật sự quan tâm.</span>
            </div>
            <Link href="#lap-la-so" className="btn btn-primary">
              Lập lá số ngay <Sparkles size={18} />
            </Link>
          </div>
        </div>
      </section>
      {showQuickReading ? <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <QuickReadingForm />
        </div>
      </section> : null}

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Kiến thức tử vi</p>
              <h2 className="section-title">Bài viết ngắn, dễ đọc cho người mới bắt đầu</h2>
            </div>
            <Link href="/kien-thuc-tu-vi" className="btn btn-ghost">
              Xem bài viết <BookOpenText size={18} />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.slug} href={`/kien-thuc-tu-vi/${article.slug}`} className="article-card group">
                <span className="article-thumb image transition group-hover:scale-[1.015]">
                  {article.coverImage ? (
                    <Image src={article.coverImage} alt={article.coverAlt || article.title} width={600} height={338} sizes="(min-width: 768px) 33vw, 100vw" />
                  ) : (
                    <Star size={26} />
                  )}
                </span>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section home-faq-section">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Câu hỏi thường gặp</p>
            <h2>Dùng Lá số tinh hoa như thế nào cho đúng?</h2>
          </div>
          <div className="grid gap-3">
            {homeFaqs.map((item) => (
              <details key={item.question} className="date-faq-item rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                <summary className="cursor-pointer text-base font-black text-stone-950">{item.question}</summary>
                <p className="mt-2 text-stone-600">{item.answer}</p>
              </details>
            ))}
          </div>
          <div className="home-faq-cta">
            <Link href="#lap-la-so" className="btn btn-primary">
              Lập lá số miễn phí <Sparkles size={18} />
            </Link>
            <Link href="/kien-thuc-tu-vi" className="btn btn-ghost">
              Đọc kiến thức nền <BookOpenText size={18} />
            </Link>
          </div>
        </div>
      </section>

      <DeferredSocialProof />
    </main>
  );
}
