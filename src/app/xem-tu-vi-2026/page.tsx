import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Compass,
  Heart,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { ChartForm } from "@/components/chart-form";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, webApplicationJsonLd, webPageJsonLd } from "@/lib/seo";

const canonicalPath = "/xem-tu-vi-2026";
const title = "Xem tử vi 2026 theo ngày giờ sinh: Luận vận năm Bính Ngọ";
const description = "Xem tử vi 2026 cá nhân theo ngày giờ sinh và giới tính. Luận công việc, tài chính, tình cảm, sức khỏe, quan hệ và nhịp 12 tháng từ lá số.";

export const metadata = routeMetadata({
  title,
  description,
  path: canonicalPath,
  imageSubtitle: "Luận vận năm Bính Ngọ theo ngày giờ sinh và lá số cá nhân",
});

type AnnualSearchParams = {
  chartError?: string;
};

const faqs = [
  {
    question: "Xem tử vi 2026 theo ngày sinh khác gì xem theo con giáp?",
    answer: "Xem theo con giáp chỉ dùng năm sinh nên cho bức tranh khá rộng. Công cụ này lập lá số từ ngày, tháng, năm, giờ sinh và giới tính, sau đó đối chiếu Mệnh–Thân, đại vận, các cung và sao lưu năm 2026. Vì vậy hai người cùng tuổi vẫn có thể nhận phần luận khác nhau.",
  },
  {
    question: "Không nhớ chính xác giờ sinh có xem tử vi năm 2026 được không?",
    answer: "Bạn vẫn có thể chọn khung giờ gần nhất để đọc thử, nhưng nên xem kết quả là bản tham khảo ban đầu. Giờ sinh có thể làm thay đổi vị trí Mệnh, Thân và cung sao; khi phân vân giữa hai khung giờ, hãy đối chiếu thêm giấy tờ hoặc hỏi người thân.",
  },
  {
    question: "Kết quả tử vi 2026 có dự đoán chính xác sự kiện từng tháng không?",
    answer: "Không. Phần 12 tháng được trình bày thành bốn chặng để bạn dễ sắp lịch tự rà soát. Công cụ không cam kết một sự kiện chắc chắn xảy ra vào tháng cụ thể và không thay dữ kiện thực tế trong công việc, tài chính hay đời sống.",
  },
  {
    question: "Tử vi 2026 có dùng để quyết định đầu tư, chữa bệnh hoặc cưới hỏi không?",
    answer: "Không nên dùng tử vi làm căn cứ duy nhất cho quyết định quan trọng. Hãy xem đây là khung tự soi chiếu, sau đó kiểm tra thông tin thật và trao đổi với chuyên gia tài chính, y tế, pháp lý hoặc người liên quan khi cần.",
  },
  {
    question: "Thông tin ngày giờ sinh có xuất hiện trên Google không?",
    answer: "Không. Landing page này được lập chỉ mục, còn trang kết quả cá nhân nằm ở URL lá số có chỉ thị noindex. Họ tên và ngày giờ sinh không được đưa vào URL công khai.",
  },
];

const readingScopes = [
  { icon: BriefcaseBusiness, title: "Công việc", body: "Vai trò, năng lực tạo giá trị và cách chọn trọng tâm trong năm." },
  { icon: WalletCards, title: "Tài chính", body: "Nhịp tạo–giữ nguồn lực, điểm cần kiểm chứng trước quyết định lớn." },
  { icon: Heart, title: "Tình cảm", body: "Cách giao tiếp, chia sẻ trách nhiệm và giữ sự gần gũi trong gia đạo." },
  { icon: Activity, title: "Sức khỏe", body: "Nhịp nghỉ ngơi, mức quá tải và thói quen nên theo dõi trong đời sống." },
  { icon: UsersRound, title: "Quan hệ", body: "Hợp tác, môi trường bên ngoài và giới hạn cần nói rõ từ đầu." },
];

function chartFormErrorMessage(chartError?: string) {
  if (chartError === "timeout") return "Hệ thống đang lập lá số chậm hơn bình thường. Bạn chờ ít phút rồi thử lại nhé.";
  if (chartError === "failed") return "Lượt này chưa lập được lá số. Bạn kiểm tra lại ngày giờ sinh rồi thử lại nhé.";
  if (chartError === "invalid") return "Tên trên lá số có ký tự chưa phù hợp. Bạn nhập tên ngắn gọn rồi thử lại nhé.";
  if (chartError === "rate_limited") return "Bạn đã lập nhiều lá số trong vài phút. Vui lòng nghỉ một chút rồi quay lại nhé.";
  return "";
}

export default async function AnnualFortune2026Page({ searchParams }: { searchParams?: Promise<AnnualSearchParams> }) {
  const params = await (searchParams ?? Promise.resolve<AnnualSearchParams>({}));
  const errorMessage = chartFormErrorMessage(params.chartError);
  const pageLd = webPageJsonLd({
    name: title,
    description,
    url: canonicalPath,
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Xem Tử vi 2026", url: canonicalPath },
    ],
  });
  const appLd = webApplicationJsonLd({ name: title, description, url: canonicalPath });
  const faqLd = faqJsonLd(faqs);

  return (
    <main className="annual-2026-landing">
      <script id="annual-2026-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="annual-2026-app-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script id="annual-2026-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="annual-2026-shell">
        <nav className="annual-2026-breadcrumb" aria-label="Đường dẫn trang">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Xem Tử vi 2026</span>
        </nav>

        <section className="annual-2026-hero" aria-labelledby="annual-2026-title">
          <div className="annual-2026-intro">
            <p className="annual-2026-kicker"><CalendarDays size={18} aria-hidden="true" /> Vận năm Bính Ngọ · Cá nhân hóa theo lá số</p>
            <h1 id="annual-2026-title">Xem tử vi 2026 theo ngày giờ sinh</h1>
            <p className="annual-2026-answer" data-answer-block="true">Tử vi năm 2026 nên được đọc từ lá số riêng, không chỉ từ con giáp. Công cụ đối chiếu ngày–giờ sinh, giới tính, Mệnh–Thân, đại vận, các cung và sao lưu năm Bính Ngọ để luận công việc, tài chính, tình cảm, sức khỏe, quan hệ cùng nhịp 12 tháng dễ áp dụng.</p>
            <div className="annual-2026-trust" aria-label="Ba điểm chính của công cụ">
              <span><ShieldCheck size={18} aria-hidden="true" /> Không phán sự kiện chắc chắn</span>
              <span><Compass size={18} aria-hidden="true" /> Có căn cứ cung sao đi kèm</span>
              <span><Sparkles size={18} aria-hidden="true" /> Có việc gợi ý để tự kiểm chứng</span>
            </div>
          </div>

          <aside className="annual-2026-form-card" id="lap-la-so-2026" aria-labelledby="annual-2026-form-title">
            <div className="annual-2026-form-heading">
              <span><Sparkles size={22} aria-hidden="true" /></span>
              <div><p>Miễn phí · Không cần đăng nhập</p><h2 id="annual-2026-form-title">Lập lá số và xem vận 2026</h2></div>
            </div>
            {errorMessage ? <p className="annual-2026-alert" role="alert">{errorMessage}</p> : null}
            <ChartForm
              experience="annual-2026"
              adSource="annual_2026"
              sourceSlug="xem-tu-vi-2026"
              entryArticle="xem-tu-vi-2026"
              ctaLocation="annual_2026_hero_form"
              submitLabel="Xem tử vi năm 2026 của tôi"
              defaultViewYear={2026}
            />
          </aside>
        </section>

        <section className="annual-2026-section" aria-labelledby="annual-2026-scopes-title">
          <div className="annual-2026-section-heading">
            <p>Năm Bính Ngọ 2026</p>
            <h2 id="annual-2026-scopes-title">Bạn sẽ nhận được điều gì trong phần luận?</h2>
            <span>Kết quả bắt đầu bằng một đoạn tổng quan mạch lạc, rồi đi sâu vào năm phương diện có ảnh hưởng trực tiếp tới đời sống.</span>
          </div>
          <div className="annual-2026-scope-grid">
            {readingScopes.map((scope) => {
              const Icon = scope.icon;
              return <article key={scope.title}><span><Icon size={22} aria-hidden="true" /></span><h3>{scope.title}</h3><p>{scope.body}</p></article>;
            })}
          </div>
        </section>

        <section className="annual-2026-section annual-2026-method" aria-labelledby="annual-2026-method-title">
          <div className="annual-2026-section-heading">
            <p>Cách hệ thống đọc vận năm</p>
            <h2 id="annual-2026-method-title">Không lấy một sao để kết luận cả năm</h2>
            <span>Mỗi nhận định được ghép từ nhiều lớp để giảm kiểu luận chung chung và giúp bạn nhìn thấy lý do đứng sau câu chữ.</span>
          </div>
          <ol>
            <li><span>1</span><div><h3>Đọc nền lá số</h3><p>Mệnh, Thân và đại vận hiện tại cho biết bối cảnh dài hơn mà năm 2026 đang nằm trong đó.</p></div></li>
            <li><span>2</span><div><h3>Đối chiếu đúng nhóm cung</h3><p>Quan Lộc–Tài Bạch cho công việc và tiền bạc; Phu Thê–Phúc Đức cho tình cảm; Tật Ách cho nhịp sống.</p></div></li>
            <li><span>3</span><div><h3>Thêm sao lưu năm 2026</h3><p>Các tín hiệu của năm Bính Ngọ được đặt cạnh chính tinh, phụ tinh và trạng thái sao, không đọc tách rời.</p></div></li>
            <li><span>4</span><div><h3>Chuyển thành việc đời thường</h3><p>Kết quả nêu điểm thuận, điểm cần giữ nhịp và một bước nhỏ để bạn tự đối chiếu với thực tế.</p></div></li>
          </ol>
          <Link href="/phuong-phap-luan" className="annual-2026-text-link">Đọc đầy đủ phương pháp luận <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>

        <section className="annual-2026-section annual-2026-compare" aria-labelledby="annual-2026-compare-title">
          <div className="annual-2026-section-heading">
            <p>Hiểu đúng trước khi xem</p>
            <h2 id="annual-2026-compare-title">Xem chung theo tuổi và xem riêng theo lá số khác nhau thế nào?</h2>
          </div>
          <div className="annual-2026-table-wrap">
            <table>
              <thead><tr><th scope="col">Cách xem</th><th scope="col">Dữ liệu sử dụng</th><th scope="col">Phù hợp khi</th></tr></thead>
              <tbody>
                <tr><th scope="row">Theo con giáp</th><td>Chủ yếu dùng năm sinh</td><td>Muốn đọc xu hướng rất rộng cho một nhóm tuổi</td></tr>
                <tr><th scope="row">Theo lá số 2026</th><td>Ngày, giờ sinh, giới tính, cung sao và vận hiện tại</td><td>Muốn biết phương diện nào cần ưu tiên trong hoàn cảnh của riêng mình</td></tr>
                <tr><th scope="row">Theo ngày cụ thể</th><td>Ngày dự kiến, mục đích và năm sinh</td><td>Đã có việc rõ ràng cần chọn thời điểm phù hợp</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="annual-2026-section annual-2026-next" aria-labelledby="annual-2026-next-title">
          <div className="annual-2026-section-heading"><p>Xem tiếp đúng nhu cầu</p><h2 id="annual-2026-next-title">Bốn lối đi sau khi đã hiểu vận năm</h2></div>
          <div>
            <Link href="/xem-tu-vi-tron-doi"><strong>Tử vi trọn đời</strong><span>Đọc nền tính cách, 12 cung và các đại vận dài hạn.</span><ArrowRight size={18} aria-hidden="true" /></Link>
            <Link href="/tu-vi-tai-loc-dau-tu"><strong>Tài lộc &amp; Đầu tư</strong><span>Đi sâu vào Tài Bạch, Quan Lộc, Thiên Di và nhịp 5 năm.</span><ArrowRight size={18} aria-hidden="true" /></Link>
            <Link href="/xem-ngay"><strong>Xem ngày tốt xấu</strong><span>Chọn thời điểm cho một việc cụ thể sau khi đã có kế hoạch.</span><ArrowRight size={18} aria-hidden="true" /></Link>
            <Link href="/xem-tuoi"><strong>Xem tuổi</strong><span>Đối chiếu hợp tác, cưới hỏi, làm nhà và các quyết định liên quan tuổi.</span><ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>

        <aside className="annual-2026-limits" aria-labelledby="annual-2026-limits-title">
          <ShieldCheck size={26} aria-hidden="true" />
          <div><h2 id="annual-2026-limits-title">Giữ quyền quyết định ở phía bạn</h2><p>Tử vi là hệ thống tham khảo giúp đặt câu hỏi và sắp thứ tự điều cần chú ý. Kết quả không thay tư vấn y tế, tài chính, pháp lý; không bảo đảm cơ hội, rủi ro hay sự kiện sẽ xảy ra. Với việc quan trọng, hãy kiểm tra dữ kiện và hỏi đúng người có chuyên môn.</p></div>
        </aside>

        <section className="annual-2026-section annual-2026-faq" aria-labelledby="annual-2026-faq-title">
          <div className="annual-2026-section-heading"><p>Giải đáp trước khi bắt đầu</p><h2 id="annual-2026-faq-title">Câu hỏi thường gặp về tử vi 2026</h2></div>
          <div>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
        </section>

        <section className="annual-2026-final" aria-labelledby="annual-2026-final-title">
          <div><p>Bắt đầu từ lá số của riêng bạn</p><h2 id="annual-2026-final-title">Xem vận 2026 để chọn việc đáng ưu tiên</h2><span>Nhập ngày giờ sinh một lần, đọc phần tổng quan và căn cứ cung sao ngay trong kết quả.</span></div>
          <a href="#lap-la-so-2026" className="btn btn-primary btn-large"><Sparkles size={19} aria-hidden="true" /> Xem tử vi 2026 của tôi</a>
        </section>

        <p className="annual-2026-updated">Cập nhật: <time dateTime="2026-08-09">09/08/2026</time></p>
      </div>
    </main>
  );
}
