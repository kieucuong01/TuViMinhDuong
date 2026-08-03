import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { ChartForm } from "@/components/chart-form";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, webApplicationJsonLd, webPageJsonLd } from "@/lib/seo";

const title = "Tử vi tài lộc & đầu tư: Bản đồ Tài Quan Di";
const description = "Lập lá số để đọc Tài Bạch, Quan Lộc, Thiên Di và biểu đồ định hướng 5 năm. Có bằng chứng cung sao, giới hạn rõ, không thay tư vấn tài chính.";
const canonicalPath = "/tu-vi-tai-loc-dau-tu";

export const metadata = routeMetadata({
  title,
  description,
  path: "/tu-vi-tai-loc-dau-tu",
  imageSubtitle: "Đọc Tài Bạch, Quan Lộc, Thiên Di theo lá số và nhịp 5 năm",
});

type WealthSearchParams = {
  chartError?: string;
};

const faqs = [
  {
    question: "Bản đồ Tài Quan Di dùng để làm gì?",
    answer: "Bản đồ giúp bạn đối chiếu cách tạo giá trị, nhịp công việc và môi trường bên ngoài theo lá số trong 5 năm. Đây là góc nhìn tham khảo để chuẩn bị và tự rà soát, không phải lời khuyên đầu tư cá nhân.",
  },
  {
    question: "Vì sao cần đọc cả Tài Bạch, Quan Lộc và Thiên Di?",
    answer: "Tài Bạch nói về cách bạn dùng và gìn giữ nguồn lực; Quan Lộc gợi ý công việc, trách nhiệm; Thiên Di cho thêm bối cảnh về môi trường, hợp tác và sự dịch chuyển. Ba cung cần được xem cùng toàn lá số.",
  },
  {
    question: "Biểu đồ 5 năm có dự báo giá hay lợi nhuận không?",
    answer: "Không. Biểu đồ chỉ trình bày các điểm nhấn định hướng theo lá số và năm xem. Bạn vẫn cần tự kiểm chứng thông tin, cân nhắc điều kiện thực tế và tham khảo chuyên gia tài chính khi ra quyết định quan trọng.",
  },
  {
    question: "Nếu không chắc giờ sinh thì có dùng được không?",
    answer: "Bạn vẫn có thể bắt đầu với khung giờ gần nhất để hiểu cách đọc. Khi có thể, hãy đối chiếu với giấy tờ gia đình hoặc người thân vì giờ sinh ảnh hưởng đến cấu trúc cung sao của lá số.",
  },
];

function chartFormErrorMessage(chartError?: string) {
  if (chartError === "timeout") return "Lập lá số đang chậm bất thường. Bạn thử lại sau ít phút nhé.";
  if (chartError === "failed") return "Chưa lập được lá số trong lượt này. Bạn kiểm tra lại thông tin sinh rồi thử lại nhé.";
  if (chartError === "invalid") return "Tên trên lá số chứa ký tự không phù hợp. Bạn nhập tên ngắn gọn rồi thử lại nhé.";
  if (chartError === "rate_limited") return "Bạn đã lập nhiều lá số trong vài phút. Vui lòng chờ một lúc rồi thử lại nhé.";
  return "";
}

export default async function WealthFortuneLandingPage({ searchParams }: { searchParams?: Promise<WealthSearchParams> }) {
  const params: WealthSearchParams = await (searchParams ?? Promise.resolve<WealthSearchParams>({}));
  const chartErrorMessage = chartFormErrorMessage(params.chartError);
  const webPageJsonLdData = webPageJsonLd({
    name: title,
    description,
    url: canonicalPath,
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Tử vi tài lộc & đầu tư", url: canonicalPath },
    ],
  });
  const webApplicationJsonLdData = webApplicationJsonLd({ name: title, description, url: canonicalPath });
  const faqJsonLdData = faqJsonLd(faqs);

  return (
    <main className="wealth-landing">
      <script id="wealth-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLdData) }} />
      <script id="wealth-app-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLdData) }} />
      <script id="wealth-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLdData) }} />

      <div className="wealth-landing-shell">
        <nav className="wealth-landing-breadcrumb" aria-label="Đường dẫn trang">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Tử vi tài lộc & đầu tư</span>
        </nav>

        <section className="wealth-landing-hero" aria-labelledby="wealth-landing-title">
          <div className="wealth-landing-intro">
            <p className="wealth-landing-kicker"><Compass size={17} aria-hidden="true" /> Bản đồ định hướng 5 năm</p>
            <h1 id="wealth-landing-title">Tử vi tài lộc & đầu tư: đọc Bản đồ Tài Quan Di</h1>
            <p className="wealth-landing-answer" data-answer-block="true">Trang này giúp bạn đọc cung Tài Bạch, Quan Lộc và Thiên Di trên lá số để nhận diện cách tạo giá trị, môi trường phù hợp và nhịp ưu tiên trong 5 năm. Kết quả là gợi ý tham khảo theo cung sao, không thay thế tư vấn tài chính hay quyết định đầu tư cá nhân.</p>
            <ul className="wealth-landing-trust" aria-label="Nguyên tắc của bản đồ">
              <li><CheckCircle2 size={18} aria-hidden="true" /> Đọc theo tổ hợp cung sao, không tách một dấu hiệu</li>
              <li><CheckCircle2 size={18} aria-hidden="true" /> Có điểm nhấn và giới hạn để tự đối chiếu</li>
              <li><CheckCircle2 size={18} aria-hidden="true" /> Không đưa khuyến nghị giao dịch hay cam kết kết quả</li>
            </ul>
          </div>

          <aside className="wealth-landing-form" id="lap-la-so-tai-loc" aria-labelledby="wealth-form-title">
            <div className="wealth-landing-form-heading">
              <Sparkles size={22} aria-hidden="true" />
              <div><p>Lập lá số miễn phí</p><h2 id="wealth-form-title">Xem bản đồ của riêng bạn</h2></div>
            </div>
            {chartErrorMessage ? <p className="wealth-landing-alert" role="alert">{chartErrorMessage}</p> : null}
            <ChartForm experience="wealth" submitLabel="Xem bản đồ tài lộc 5 năm" defaultViewYear={2026} />
          </aside>
        </section>

        <section className="wealth-landing-section wealth-landing-palaces" aria-labelledby="wealth-palaces-title">
          <div className="wealth-landing-section-heading"><p>Ba lớp cần đối chiếu</p><h2 id="wealth-palaces-title">Tài–Quan–Di đọc gì?</h2><span>Không cung nào đủ để kết luận thay cho toàn lá số và hoàn cảnh thật của bạn.</span></div>
          <div className="wealth-landing-card-grid">
            <Link href="/tra-cuu/cung-tai-bach" className="wealth-landing-card"><span>Tài Bạch</span><h3>Cách tạo, dùng và giữ nguồn lực</h3><p>Nhìn phong cách làm ra giá trị, nhu cầu tích lũy và điểm cần quản trị dòng tiền.</p><strong>Tra cứu cung Tài Bạch <ArrowRight size={17} aria-hidden="true" /></strong></Link>
            <Link href="/tra-cuu/cung-quan-loc" className="wealth-landing-card"><span>Quan Lộc</span><h3>Công việc, trách nhiệm và năng lực</h3><p>Đối chiếu con đường tạo giá trị với vai trò, kỷ luật và cách phát triển nghề nghiệp.</p><strong>Tra cứu cung Quan Lộc <ArrowRight size={17} aria-hidden="true" /></strong></Link>
            <Link href="/tra-cuu/cung-thien-di" className="wealth-landing-card"><span>Thiên Di</span><h3>Môi trường, hợp tác và dịch chuyển</h3><p>Xem lớp bối cảnh bên ngoài: quan hệ, cơ hội tiếp xúc và cách thích nghi khi thay đổi.</p><strong>Tra cứu cung Thiên Di <ArrowRight size={17} aria-hidden="true" /></strong></Link>
          </div>
        </section>

        <section className="wealth-landing-section wealth-landing-method" aria-labelledby="wealth-method-title">
          <div className="wealth-landing-section-heading"><p>Phương pháp chấm</p><h2 id="wealth-method-title">Biểu đồ tổng hợp tín hiệu, không thay việc tự quyết</h2><span>Mỗi năm được đọc từ nền cung sao, lưu tinh theo năm tại Tài–Quan–Di và mối liên hệ giữa ba cung để làm rõ trọng tâm chuẩn bị.</span></div>
          <div className="wealth-landing-table-wrap"><table><thead><tr><th scope="col">Lớp đọc</th><th scope="col">Bạn nhận được</th><th scope="col">Cách dùng an toàn</th></tr></thead><tbody><tr><th scope="row">Tài Bạch</th><td>Điểm cần ưu tiên khi tạo và quản trị nguồn lực</td><td>Đặt cạnh thu nhập, chi tiêu và mục tiêu thật của bạn</td></tr><tr><th scope="row">Quan Lộc</th><td>Gợi ý về công việc, trách nhiệm và năng lực cần bồi dưỡng</td><td>Chia thành kế hoạch học hỏi hoặc hoàn thiện quy trình</td></tr><tr><th scope="row">Thiên Di</th><td>Bối cảnh hợp tác, môi trường và thay đổi bên ngoài</td><td>Kiểm chứng bằng thông tin thực tế trước mọi cam kết</td></tr></tbody></table></div>
        </section>

        <section className="wealth-landing-section wealth-landing-use" aria-labelledby="wealth-use-title">
          <div className="wealth-landing-section-heading"><p>Cách dùng biểu đồ</p><h2 id="wealth-use-title">Bốn bước để biến phần đọc thành việc chuẩn bị cụ thể</h2></div>
          <ol className="wealth-landing-checklist"><li><span>1</span><div><h3>Lập lá số với ngày, giờ sinh gần đúng nhất</h3><p>Chọn năm xem 2026 để mở bản đồ định hướng năm năm đầu tiên.</p></div></li><li><span>2</span><div><h3>Đọc điểm nhấn của từng năm</h3><p>Ghi lại điều cần củng cố thay vì chỉ chú ý các từ tích cực hay tiêu cực.</p></div></li><li><span>3</span><div><h3>Đối chiếu với công việc và dòng tiền thật</h3><p>So lại mục tiêu, quỹ dự phòng, năng lực và các mốc đang có của bạn.</p></div></li><li><span>4</span><div><h3>Chọn một hành động nhỏ có thể kiểm chứng</h3><p>Ví dụ hoàn thiện kỹ năng, rà soát ngân sách hoặc chuẩn bị cho cuộc trao đổi quan trọng.</p></div></li></ol>
        </section>

        <section className="wealth-landing-limits" aria-labelledby="wealth-limits-title"><ShieldCheck size={25} aria-hidden="true" /><div><h2 id="wealth-limits-title">Giới hạn cần nhớ</h2><p>Tử vi là một hệ thống tham khảo để gợi mở cách nhìn. Trang này không dự báo giá, lợi nhuận hoặc thời điểm giao dịch; không thay thế tư vấn tài chính, pháp lý hay chuyên môn phù hợp với hoàn cảnh của bạn.</p><div><Link href="/phuong-phap-luan">Xem phương pháp luận</Link><Link href="/tac-gia">Tác giả và đội ngũ</Link><Link href="/chinh-sach-bien-tap">Chính sách biên tập</Link><Link href="/tra-cuu/y-nghia-12-cung">Tra cứu ý nghĩa 12 cung</Link></div><p className="wealth-landing-updated">Cập nhật: <time dateTime="2026-08-03">03/08/2026</time></p></div></section>

        <section className="wealth-landing-section wealth-landing-faq" aria-labelledby="wealth-faq-title"><div className="wealth-landing-section-heading"><p>Giải đáp ngắn</p><h2 id="wealth-faq-title">Câu hỏi thường gặp</h2></div><div>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>

        <section className="wealth-landing-final" aria-labelledby="wealth-final-title"><div><p>Bắt đầu từ dữ liệu lá số của bạn</p><h2 id="wealth-final-title">Xem bản đồ Tài Quan Di với giới hạn rõ ràng</h2><span>Đi từ cung sao đến việc chuẩn bị, rồi tự đối chiếu cùng điều kiện thực tế.</span></div><a href="#lap-la-so-tai-loc" className="btn btn-primary btn-large"><Sparkles size={20} aria-hidden="true" /> Lập lá số và xem bản đồ</a></section>
      </div>
    </main>
  );
}
