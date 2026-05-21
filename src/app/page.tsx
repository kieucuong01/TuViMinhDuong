import { ArrowRight, BarChart3, BookOpenText, Coins, ShieldCheck, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChartForm } from "@/components/chart-form";
import { DayFortuneCard } from "@/components/day-fortune-card";
import { QuickReadingForm } from "@/components/quick-reading-form";
import { listArticles } from "@/lib/data";
import { APP_NAME } from "@/lib/env";

export const revalidate = 300;

export default async function Home() {
  const articles = (await listArticles()).slice(0, 3);
  const trustSignals = [
    ["Lập lá số miễn phí", "Xem tổng quan cơ bản miễn phí, mở chuyên sâu bằng xu."],
    ["Chuẩn phổ thông", "An sao và hiển thị lá số theo quy ước Việt Nam."],
    ["Lưu lịch sử", "Mỗi tài khoản có thể tra nhiều lá số và xem lại."],
  ];
  const previewItems = [
    ["Mệnh & Thân", "Tóm tắt khí chất, thế mạnh, điểm cần tiết chế."],
    ["Vận trình", "Đọc đại vận, tiểu vận, tháng và ngày theo từng lớp."],
    ["Gợi ý hành động", "Chuyển luận giải thành việc nên làm, nên tránh."],
  ];
  const steps = [
    ["01", "Nhập ngày giờ sinh", "Chọn dương/âm lịch, giờ sinh và năm muốn xem."],
    ["02", "Nhận lá số rõ ràng", "Desktop có bàn 12 cung, mobile có bản đọc từng cung."],
    ["03", "Đọc luận giải AI", "Nội dung được chia mục, dễ đọc và xem lại trong lịch sử."],
  ];

  return (
    <main>
      <section className="hero-band">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="eyebrow inline-flex w-fit rounded-full border border-orange-200 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur">
              Tử vi AI cho người Việt
            </p>
            <h1 className="max-w-4xl text-balance text-4xl font-black leading-tight text-stone-950 sm:text-5xl lg:text-6xl">
              Lập lá số tử vi, đọc vận trình và quản lý luận giải bằng xu
            </h1>
            <p className="mt-5 max-w-3xl text-pretty text-base leading-8 text-stone-700 sm:text-lg">
              {APP_NAME} tạo lá số theo chuẩn phổ thông, lưu dữ liệu có cấu trúc và dùng AI để viết luận giải dễ hiểu, thực tế, không khẳng định cực đoan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#lap-la-so" className="btn btn-primary">
                Khởi tạo lá số <ArrowRight size={18} />
              </a>
              <a href="#mua-nhanh" className="btn btn-ghost">
                Mua nhanh qua email
              </a>
              <Link href="/kien-thuc-tu-vi" className="btn btn-ghost">
                Đọc kiến thức
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Miễn phí", "Lập lá số cơ bản"],
                ["12 cung", "Lá số chuẩn phổ thông"],
                ["Mobile", "Đọc rõ từng cung"],
                ["Lịch sử", "Lưu nhiều lá số"],
              ].map(([value, label]) => (
                <div key={label} className="metric-card">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <DayFortuneCard />

            <div id="lap-la-so" className="hero-form-card ring-1 ring-white/70">
              <div className="mb-5 text-center">
                <p className="eyebrow">Khởi tạo lá số</p>
                <h2 className="text-3xl font-black tracking-tight text-stone-950">Khám phá vận mệnh</h2>
                <p className="mt-2 text-sm font-medium text-stone-500">Định hướng tương lai từ dữ liệu lá số</p>
              </div>
              <ChartForm />
              <div className="form-assurance">
                <span><ShieldCheck size={15} /> Không cần nạp xu</span>
                <span><Sparkles size={15} /> Có luận giải mẫu ngay</span>
                <span><BarChart3 size={15} /> Lưu hồ sơ lá số</span>
              </div>
            </div>
          </div>

          <div className="hero-trust-row" aria-label={`Điểm mạnh chính của ${APP_NAME}`}>
            {trustSignals.map(([title, body]) => (
              <article key={title}>
                <ShieldCheck size={18} />
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
                <h2 className="section-title">Thấy ngay phần đáng đọc nhất của vận trình</h2>
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
                <span><Sparkles size={18} /></span>
                <div>
                  <strong>Tổng quan luận giải</strong>
                  <p>Được chia thành ý chính, điểm sáng, lưu ý và gợi ý hành động.</p>
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
                    <Star size={16} />
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="journey-panel">
            <p className="eyebrow">Dễ bắt đầu</p>
            <h2 className="text-balance text-3xl font-black tracking-tight text-stone-950">Từ thông tin sinh đến bản luận giải chỉ trong 3 bước</h2>
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
              <Coins size={18} />
              <span>Luận giải chuyên sâu dùng xu minh bạch: mua một lần, lưu lại trong tài khoản và xem lại miễn phí.</span>
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
            <p className="eyebrow">Truyền thống không mất đi</p>
            <h2>Chỉ được nâng tầm bằng dữ liệu và trải nghiệm tốt hơn</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [Sparkles, "Giải pháp luận giải AI", "Lá số được an sao thành dữ liệu có cấu trúc, AI chỉ giải thích từ dữ liệu đó."],
              [ShieldCheck, "Xu minh bạch", "Coin ledger ghi nhận từng giao dịch, mua luận giải một lần và xem lại miễn phí."],
              [BarChart3, "SEO & tốc độ", "CMS có chấm điểm SEO, metadata, sitemap và tối ưu Core Web Vitals."],
            ].map(([Icon, title, body]) => (
              <article key={String(title)} className="feature-card group">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-700 ring-1 ring-orange-200 transition group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white">
                  <Icon size={24} />
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
            <p className="eyebrow">Nhìn thấu tiềm năng</p>
            <h2 className="section-title">Biểu đồ vận trình được thiết kế để đọc nhanh</h2>
            <p className="mt-4 text-pretty text-stone-700">
              Giao diện ưu tiên mobile, desktop có bàn lá số 12 cung, mobile có accordion để không phải căng mắt đọc chữ nhỏ.
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
              <h2 className="section-title">Bài viết nền tảng, tối ưu SEO từ CMS</h2>
            </div>
            <Link href="/kien-thuc-tu-vi" className="btn btn-ghost">
              Xem tất cả <BookOpenText size={18} />
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
                <span className="seo-pill">SEO {article.seoScore || 0}/100</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-stone-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div>
            <p className="eyebrow text-orange-300">Bắt đầu miễn phí</p>
            <h2 className="text-balance text-3xl font-black">Tạo lá số đầu tiên miễn phí, mở luận giải chuyên sâu khi bạn cần</h2>
          </div>
          <Link href="/#lap-la-so" className="btn btn-primary">
            <Coins size={18} /> Lập lá số ngay
          </Link>
        </div>
      </section>
    </main>
  );
}
