import { ArrowRight, BookOpenText, CheckCircle2, Coins, Eye, FileText, History, ShieldCheck, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChartForm } from "@/components/chart-form";
import { DayFortuneCard } from "@/components/day-fortune-card";
import { DeferredSocialProof } from "@/components/deferred-social-proof";
import { QuickReadingForm } from "@/components/quick-reading-form";
import { listArticles } from "@/lib/data";
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
  const articles = (await listArticles()).slice(0, 3);
  const trustSignals = [
    ["Miễn phí lập lá số", "Nhập ngày giờ sinh và xem ngay phần cơ bản."],
    ["Dễ đọc trên điện thoại", "Mỗi cung được chia rõ, không phải căng mắt đọc chữ nhỏ."],
    ["Mua một lần, xem lại", "Luận giải đã mở sẽ được lưu trong tài khoản."],
  ];
  const previewItems = [
    ["Tổng quan", "Nắm nhanh Mệnh, Thân và điểm nổi bật của lá số."],
    ["Điểm mạnh", "Biết phần nên phát huy trong công việc, tài lộc, gia đạo."],
    ["Điều nên lưu ý", "Nhìn rõ các giai đoạn cần thận trọng hơn."],
  ];
  const steps = [
    ["01", "Nhập ngày giờ sinh", "Chọn ngày sinh, giờ sinh, giới tính và năm muốn xem."],
    ["02", "Xem lá số miễn phí", "Nhận bàn lá số 12 cung và phần tóm tắt cơ bản."],
    ["03", "Mở luận giải khi cần", "Bản đầy đủ được chia mục rõ ràng, dễ đọc lại sau."],
  ];

  return (
    <main>
      <script id="website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
      <script id="organization-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <section className="hero-band">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
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

      <section className="section home-preview-section">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="result-preview-panel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="eyebrow">Sau khi lập lá số</p>
                <h2 className="section-title">Đọc phần quan trọng trước, không bị rối</h2>
              </div>
              <a href="#lap-la-so" className="btn btn-primary btn-small">
                Thử ngay <ArrowRight size={17} />
              </a>
            </div>
            <div className="preview-tabs" aria-hidden="true">
              {["Lá số", "Luận cung", "Đại vận", "Nguyệt vận", "Nhật vận"].map((tab, index) => (
                <span key={tab} className={index === 0 ? "active" : ""}>{tab}</span>
              ))}
            </div>
            <div className="reading-preview-card">
              <div className="reading-preview-head">
                <span><FileText size={19} /></span>
                <div>
                  <strong>Bản luận giải chia mục</strong>
                  <p>Mỗi phần có tiêu đề rõ, đoạn ngắn, dễ đọc trên cả máy tính và điện thoại.</p>
                </div>
              </div>
              <div className="reading-preview-bars" aria-hidden="true">
                {[72, 46, 84, 58, 66].map((width, index) => (
                  <i key={index} style={{ width: `${width}%` }} />
                ))}
              </div>
              <div className="preview-item-grid">
                {previewItems.map(([title, body]) => (
                  <article key={title}>
                    <Star size={17} />
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="journey-panel">
            <p className="eyebrow">Dễ bắt đầu</p>
            <h2 className="text-balance text-3xl font-black tracking-tight text-stone-950">Từ ngày sinh đến bản luận giải trong 3 bước</h2>
            <div className="journey-steps">
              {steps.map(([number, title, body]) => (
                <article key={number}>
                  <b>{number}</b>
                  <div>
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="journey-note">
              <Coins size={20} />
              <span>Giá hiển thị rõ trước khi mở khóa. Mua một lần, xem lại trong tài khoản.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <QuickReadingForm />
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Vì sao dễ dùng</p>
            <h2>Thiết kế cho người muốn xem nhanh, đọc rõ, không cần biết kỹ thuật</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [FileText, "Lá số rõ ràng", "Bàn 12 cung giữ đủ thông tin chính, mobile có bản đọc từng cung."],
              [Sparkles, "Luận giải dễ hiểu", "Nội dung trình bày theo mục ngắn, tránh đoạn văn quá dài."],
              [ShieldCheck, "Thanh toán minh bạch", "Giá mở khóa hiện ngay trên nút, không trừ xu khi xem lại."],
            ].map(([Icon, title, body]) => (
              <article key={String(title)} className="feature-card group">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700 ring-1 ring-orange-200 transition group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white">
                  <Icon size={25} />
                </span>
                <h3>{String(title)}</h3>
                <p>{String(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-gradient-to-b from-[#fff7e5] to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="eyebrow">Xem vận trình</p>
            <h2 className="section-title">Biểu đồ và thẻ thông tin giúp đọc nhanh hơn</h2>
            <p className="mt-4 text-pretty text-lg leading-8 text-stone-700">
              Bạn có thể xem tổng quan, rồi mở từng phần như Đại vận, Nguyệt vận hoặc Nhật vận khi cần.
            </p>
          </div>
          <div className="analytics-card">
            <div className="bar-chart" aria-hidden="true">
              {[38, 54, 28, 76, 46, 62, 88, 40].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="line-chart" aria-hidden="true">
              <svg viewBox="0 0 360 140" role="img" aria-label="Biểu đồ mô phỏng vận trình">
                <path d="M0 92 C35 42 60 118 96 70 C130 22 150 122 188 66 C228 10 248 116 282 74 C316 36 334 44 360 28" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
                <path d="M0 104 C40 60 76 132 118 82 C156 36 170 130 210 76 C248 28 270 122 306 88 C330 70 342 58 360 50" fill="none" stroke="#a8a29e" strokeWidth="7" strokeLinecap="round" opacity=".55" />
              </svg>
            </div>
          </div>
        </div>
      </section>

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
