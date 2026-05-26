import { BookOpenText, CheckCircle2, Coins, Eye, History, MessageCircle, ShieldCheck, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChartForm } from "@/components/chart-form";
import { DayFortuneCard } from "@/components/day-fortune-card";
import { DeferredSocialProof } from "@/components/deferred-social-proof";
import { QuickReadingForm } from "@/components/quick-reading-form";
import { getOperationSettings, listArticles } from "@/lib/data";
import { APP_NAME } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata = routeMetadata({
  title: "Lập lá số tử vi miễn phí",
  description: "Lập lá số tử vi miễn phí, xem lá số 12 cung, xem ngày tốt xấu và mở luận giải dễ hiểu khi muốn đọc sâu hơn.",
  path: "/",
  imageSubtitle: "Nhập ngày giờ sinh để xem lá số cơ bản ngay",
});

export default async function Home() {
  const [articleList, operationSettings] = await Promise.all([listArticles(), getOperationSettings()]);
  const articles = articleList.slice(0, 3);
  const showQuickReading = operationSettings.paymentsEnabled && operationSettings.paidReadingsEnabled;
  const trustSignals = [
    ["Miễn phí lập lá số", "Nhập ngày giờ sinh và xem ngay phần cơ bản."],
    ["Dễ đọc trên điện thoại", "Mỗi cung được chia rõ, không phải căng mắt đọc chữ nhỏ."],
    ["Mua một lần, xem lại", "Luận giải đã mở sẽ được lưu trong tài khoản."],
  ];
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
      body: "Điểm mình thích là đọc trên điện thoại khá gọn, từng phần tách rõ. Bản miễn phí đủ để biết nên mở mục nào trước, không bị cảm giác mua mù.",
    },
    {
      initial: "L",
      name: "Linh",
      date: "21/5/2026",
      badge: "Đã nạp xu",
      body: "Mình lỡ nhập nhầm email lúc đầu, admin hỗ trợ tìm lại lá số khá nhanh. Luận giải không hù dọa, đọc kiểu định hướng nên dễ tiếp nhận.",
      adminReply: "Cảm ơn Linh. Bên mình luôn ưu tiên giữ nội dung ở mức tham khảo thực tế, không gieo lo lắng. Nếu cần tìm lại lá số, bạn cứ dùng đúng email đã mua là được.",
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
      badge: "Mua lại để xem",
      body: "Lúc đầu chỉ định xem thử, nhưng phần miễn phí viết có cấu trúc nên mình mở bản đầy đủ. Có mục nên lưu ý khá sát với chuyện gia đình của mình.",
      adminReply: "Cảm ơn Khánh đã tin dùng. Khi đọc các mục gia đình, bạn nên đối chiếu thêm Phúc Đức, Phụ Mẫu và bối cảnh thực tế để có góc nhìn cân bằng hơn.",
    },
  ];

  return (
    <main>
      <script id="website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
      <script id="organization-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <section className="hero-band">
        <div className="hero-shell mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
            <div id="lap-la-so" className="hero-form-card ring-1 ring-white/70">
              <div className="mb-5 text-center">
                <p className="eyebrow">Lập lá số miễn phí</p>
                <h1 className="text-balance text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">Lập lá số tử vi miễn phí</h1>
                <p className="mt-2 text-base font-medium text-stone-600">Nhập thông tin sinh bên dưới để xem lá số cơ bản ngay.</p>
              </div>
              <ChartForm />
              <div className="form-assurance">
                <span><ShieldCheck size={17} /> Không cần thanh toán để lập lá số</span>
                <span><Eye size={17} /> Có bản đọc rõ trên điện thoại</span>
                <span><History size={17} /> Đăng nhập để lưu và xem lại</span>
              </div>
            </div>

            <DayFortuneCard />
          </div>

          <div className="hero-trust-row" aria-label={`Điểm mạnh chính của ${APP_NAME}`}>
            {trustSignals.map(([title, body]) => (
              <article key={title}>
                <CheckCircle2 size={20} />
                <div>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              </article>
            ))}
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
              <span>Lập miễn phí trước, đọc tổng quan rồi chọn phần cần mở khóa sau.</span>
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

      <section className="section bg-stone-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div>
            <p className="eyebrow text-orange-300">Bắt đầu miễn phí</p>
            <h2 className="text-balance text-3xl font-black">Tạo lá số đầu tiên, xem phần cơ bản rồi quyết định có mở bản đầy đủ hay không</h2>
          </div>
          <Link href="/#lap-la-so" className="btn btn-primary btn-large">
            <Coins size={20} /> Lập lá số ngay
          </Link>
        </div>
      </section>
      <DeferredSocialProof />
    </main>
  );
}
