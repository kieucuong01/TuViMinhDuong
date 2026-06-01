import Link from "next/link";
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { ChartForm } from "@/components/chart-form";
import { routeMetadata } from "@/lib/metadata";
import { webPageJsonLd } from "@/lib/seo";

export const metadata = routeMetadata({
  title: "Lập lá số tử vi miễn phí trước khi luận giải",
  description:
    "Trang lập lá số tử vi miễn phí cho người mới: nhập ngày giờ sinh, xem bản cơ bản trước, rồi chỉ mở luận giải chuyên sâu khi thật sự cần.",
  path: "/lap-la-so",
  imageSubtitle: "Đọc bản miễn phí trước, chi phí hiển thị rõ khi muốn mở luận giải",
  robots: { index: false, follow: true },
});

const trustPoints = [
  "Không cần trả phí để tạo lá số cơ bản.",
  "Nội dung viết theo hướng tham khảo, không hù dọa hay cam kết tuyệt đối.",
  "Chi phí mở luận giải hiển thị rõ trước khi thanh toán.",
];

const steps = [
  { title: "1. Nhập ngày giờ sinh", detail: "Chọn ngày, tháng, năm, giờ sinh và năm muốn xem." },
  { title: "2. Xem lá số miễn phí", detail: "Đọc bố cục 12 cung, thông tin nhanh và phần tổng quan." },
  { title: "3. Mở phần cần đọc sâu", detail: "Khi muốn đi tiếp, bạn có thể mở toàn bộ hoặc từng phần bằng xu." },
];

export default function AdsChartLandingPage() {
  const pageLd = webPageJsonLd({
    name: "Lập lá số tử vi miễn phí trước khi luận giải",
    description:
      "Trang lập lá số tử vi dành cho người tìm từ Google Ads, tập trung vào form tạo lá số, bản miễn phí và lựa chọn mở luận giải rõ ràng.",
    url: "/lap-la-so",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Lập lá số", url: "/lap-la-so" },
    ],
  });

  return (
    <main className="bg-[#fff7e8]">
      <script id="ads-lap-la-so-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <section className="relative overflow-hidden border-b border-orange-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(120,53,15,0.14),transparent_30%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:px-8 lg:py-12">
          <div>
            <p className="eyebrow">Lập lá số tử vi miễn phí</p>
            <h1 className="text-balance text-4xl font-black tracking-tight text-stone-950 sm:text-5xl">
              Đọc bản miễn phí trước, chỉ mở luận giải khi bạn thấy cần
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
              Lá số tinh hoa giúp bạn tạo lá số nhanh, đọc dễ trên điện thoại và hiểu các phần chính trước khi quyết định xem sâu hơn.
            </p>
            <div className="mt-6 grid gap-3">
              {trustPoints.map((point) => (
                <span key={point} className="inline-flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-3 text-base font-bold text-stone-700 shadow-sm ring-1 ring-orange-100">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                  {point}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#lap-la-so-form" className="btn btn-primary btn-large" data-ad-click="ads_landing_scroll_form" data-ad-placement="ads_landing_hero">
                <Sparkles size={20} /> Tạo lá số ngay
              </Link>
              <Link href="/pricing" className="btn btn-ghost btn-large" data-ad-click="pricing_click" data-ad-placement="ads_landing_hero">
                <CreditCard size={20} /> Xem giá trước
              </Link>
            </div>
          </div>

          <div id="lap-la-so-form" className="hero-form-card ring-1 ring-white/70">
            <div className="mb-5 text-center">
              <p className="eyebrow">Bắt đầu tại đây</p>
              <h2 className="text-balance text-3xl font-black text-stone-950">Nhập thông tin sinh</h2>
              <p className="mt-2 text-base font-medium text-stone-600">Sau khi tạo xong, hệ thống sẽ chuyển sang trang lá số của bạn.</p>
            </div>
            <ChartForm adSource="google_ads_landing" />
            <div className="form-assurance">
              <span><ShieldCheck size={17} /> Không yêu cầu thanh toán ở bước tạo lá số</span>
              <span><CheckCircle2 size={17} /> Có thể đọc phần cơ bản trước</span>
              <span><CreditCard size={17} /> Nạp xu qua PayOS/VietQR khi muốn mở luận giải</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Cách sử dụng</p>
            <h2>Đi từ miễn phí đến trả phí một cách rõ ràng</h2>
            <p>Nếu bạn mới xem tử vi, hãy bắt đầu bằng lá số cơ bản. Phần trả phí chỉ nên mở khi bạn muốn đọc kỹ hơn về công việc, tài chính, tình cảm hoặc vận hạn.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="feature-card">
                <Sparkles className="text-orange-600" size={24} />
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div className="panel">
            <p className="eyebrow">Lưu ý quan trọng</p>
            <h2 className="text-2xl font-black text-stone-950">Tử vi là nội dung tham khảo, không thay thế quyết định chuyên môn</h2>
            <p className="mt-3 text-base leading-7 text-stone-600">
              Khi đọc luận giải, bạn nên xem như một gợi ý tự soi chiếu. Những quyết định lớn về sức khỏe, pháp lý, tài chính hoặc hôn nhân vẫn cần cân nhắc thực tế và ý kiến chuyên môn phù hợp.
            </p>
          </div>
          <Link href="#lap-la-so-form" className="btn btn-primary btn-large" data-ad-click="ads_landing_bottom_cta" data-ad-placement="ads_landing_bottom">
            Lập lá số miễn phí <Sparkles size={20} />
          </Link>
        </div>
      </section>
    </main>
  );
}
