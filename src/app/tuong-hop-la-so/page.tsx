import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, HeartHandshake, Layers3, MessageCircleQuestion, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ChartCompatibilityTool } from "@/components/chart-compatibility-tool";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, webApplicationJsonLd, webPageJsonLd } from "@/lib/seo";

const canonicalPath = "/tuong-hop-la-so";
const title = "Tương hợp 2 lá số: Luận tình cảm và giao tiếp";
const description = "So sánh hai lá số tử vi theo Mệnh–Thân, Phu Thê, Phúc Đức, Tài Bạch và Quan Lộc. Luận giải chi tiết, dễ hiểu, có căn cứ và gợi ý đối thoại.";

export const metadata = routeMetadata({
  title,
  description,
  path: "/tuong-hop-la-so",
  imageTitle: "Tương hợp 2 lá số",
  imageSubtitle: "Đối chiếu tình cảm, giao tiếp, tiền bạc và đời sống chung theo hai lá số",
});

const faqs = [
  {
    question: "Tương hợp 2 lá số là gì?",
    answer: "Đây là cách đặt hai lá số tử vi cạnh nhau để đối chiếu Mệnh–Thân, Phu Thê, Phúc Đức và các cung liên quan đến giao tiếp, tiền bạc, công việc, gia đình. Kết quả gợi mở điểm thuận và chủ đề nên trao đổi, không phán quyết quan hệ.",
  },
  {
    question: "Tương hợp hai lá số có giống xem tuổi vợ chồng không?",
    answer: "Không hoàn toàn. Xem tuổi thường bắt đầu từ Can–Chi, ngũ hành năm sinh và các quy tắc tuổi. Tương hợp hai lá số dùng thêm giờ sinh để đối chiếu cấu trúc cung sao của từng người, vì vậy có nhiều lớp bối cảnh cá nhân hơn.",
  },
  {
    question: "Không nhớ chính xác giờ sinh có xem được không?",
    answer: "Bạn có thể thử với khung giờ gần nhất để hiểu cách công cụ hoạt động, nhưng nên thận trọng với kết quả. Giờ sinh có thể làm vị trí Mệnh, Thân và các cung sao thay đổi; hãy đối chiếu giấy tờ hoặc hỏi người thân khi có thể.",
  },
  {
    question: "Kết quả có cho biết hai người nên cưới hay chia tay không?",
    answer: "Không. Lá số không thay được sự đồng thuận, an toàn, trách nhiệm và hành vi thực tế. Báo cáo chỉ giúp hai người có thêm ngôn ngữ để nhìn lại cách giao tiếp, cam kết, tiền bạc và đời sống chung.",
  },
  {
    question: "Có thể dùng công cụ cho người yêu, vợ chồng và đối tác làm ăn không?",
    answer: "Có. Sáu chủ đề được thiết kế đủ rộng cho quan hệ tình cảm và hợp tác. Với đối tác, nên ưu tiên phần công việc, phân vai, tiền bạc; với vợ chồng hoặc người yêu, đọc thêm cam kết, gia đình và cách giải quyết bất đồng.",
  },
  {
    question: "Thông tin ngày giờ sinh có được lưu lại không?",
    answer: "Không. Công cụ tính hai lá số và tạo báo cáo ngay trên thiết bị đang dùng. Dữ liệu nhập ở form này không được lưu vào tài khoản và không gửi tới dịch vụ AI bên ngoài.",
  },
];

const readingLayers = [
  { title: "Nhịp tính cách", text: "Đối chiếu Mệnh và Phúc Đức để hiểu tốc độ phản ứng, nhu cầu ổn định và cách mỗi người lấy lại cân bằng." },
  { title: "Giao tiếp", text: "Đọc Mệnh, Nô Bộc, Thiên Di để nhận diện cách nói, cách nghe và mẫu xử lý bất đồng khi có áp lực bên ngoài." },
  { title: "Tình cảm và cam kết", text: "Đặt Phu Thê cạnh Phúc Đức để hiểu kỳ vọng gắn bó, sự gần gũi, trách nhiệm và ảnh hưởng từ nền gia đình." },
  { title: "Tiền bạc", text: "Ghép Tài Bạch với Điền Trạch để bàn cách dùng nguồn lực, tích lũy, nhà cửa và giới hạn của quyết định chung." },
  { title: "Công việc", text: "Dùng Quan Lộc, Thiên Di, Nô Bộc để soi cách phân vai, hợp tác, chịu áp lực và tách công việc khỏi đời sống riêng." },
  { title: "Gia đình", text: "Đọc Phúc Đức, Phụ Mẫu, Tử Tức để nói về nơi ở, người thân, con cái và kế hoạch dài hạn theo hoàn cảnh thật." },
];

function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function ChartCompatibilityPage() {
  const webPage = webPageJsonLd({
    name: title,
    description,
    url: canonicalPath,
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Tử vi", url: "/xem-tu-vi-tron-doi" },
      { name: "Tương hợp 2 lá số", url: canonicalPath },
    ],
  });
  const webApplication = webApplicationJsonLd({ name: title, description, url: canonicalPath });
  const faq = faqJsonLd(faqs);

  return (
    <main className="compatibility-landing">
      <script id="compatibility-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webPage) }} />
      <script id="compatibility-app-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(webApplication) }} />
      <script id="compatibility-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faq) }} />

      <div className="compatibility-landing-shell">
        <nav className="compatibility-breadcrumb" aria-label="Đường dẫn trang">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><Link href="/xem-tu-vi-tron-doi">Tử vi</Link><span aria-hidden="true">/</span><span aria-current="page">Tương hợp 2 lá số</span>
        </nav>

        <header className="compatibility-hero">
          <div className="compatibility-hero-icon" aria-hidden="true"><Users size={30} /><HeartHandshake size={24} /></div>
          <p className="compatibility-kicker">Công cụ đối chiếu hai lá số miễn phí</p>
          <h1>Tương hợp 2 lá số: đối chiếu tình cảm, giao tiếp và đời sống chung</h1>
          <p className="compatibility-answer" data-answer-block="true">Tương hợp hai lá số là cách đặt cấu trúc cung sao của hai người cạnh nhau để hiểu điểm thuận, khác biệt và chủ đề nên trao đổi. Báo cáo đọc sáu lớp từ tính cách, tình cảm đến tiền bạc, công việc, gia đình; có căn cứ lá số và gợi ý thực tế, không phán quyết quan hệ.</p>
          <div className="compatibility-trust-row" aria-label="Nguyên tắc của công cụ">
            <span><CheckCircle2 aria-hidden="true" size={17} /> Không lưu dữ liệu sinh</span>
            <span><CheckCircle2 aria-hidden="true" size={17} /> Có căn cứ cung sao</span>
            <span><CheckCircle2 aria-hidden="true" size={17} /> Không chấm điểm định đoạt</span>
          </div>
        </header>

        <section className="compatibility-tool-section" aria-label="Công cụ tương hợp hai lá số">
          <ChartCompatibilityTool />
        </section>

        <section className="compatibility-static-section" aria-labelledby="compatibility-definition-title">
          <div className="compatibility-static-heading"><p>Hiểu đúng trước khi xem</p><h2 id="compatibility-definition-title">Xem tương hợp hai lá số để làm gì?</h2></div>
          <div className="compatibility-definition-grid">
            <div className="compatibility-definition-answer"><MessageCircleQuestion aria-hidden="true" size={25} /><p>Giá trị của báo cáo không nằm ở một con số hợp hay khắc. Nó giúp hai người gọi tên khác biệt, thấy điểm có thể bổ sung và chuẩn bị những cuộc trao đổi cụ thể về cam kết, tiền bạc, công việc, gia đình.</p></div>
            <ul>
              <li><strong>Nhìn điểm thuận:</strong> điều gì đang giúp hai người hiểu và nâng đỡ nhau.</li>
              <li><strong>Nhìn điểm dễ lệch:</strong> khác nhau ở tốc độ, kỳ vọng hay cách ra quyết định.</li>
              <li><strong>Chuyển thành hành động:</strong> mỗi phần đều có việc nhỏ và câu hỏi để cùng thử.</li>
            </ul>
          </div>
        </section>

        <section className="compatibility-static-section" aria-labelledby="compatibility-difference-title">
          <div className="compatibility-static-heading"><p>Chọn đúng công cụ</p><h2 id="compatibility-difference-title">Xem tuổi và tương hợp hai lá số khác nhau thế nào?</h2></div>
          <div className="compatibility-table-wrap">
            <table>
              <thead><tr><th scope="col">Cách xem</th><th scope="col">Dữ liệu chính</th><th scope="col">Câu hỏi phù hợp</th><th scope="col">Giới hạn</th></tr></thead>
              <tbody>
                <tr><th scope="row">Xem tuổi vợ chồng</th><td>Can–Chi, ngũ hành năm sinh và quy tắc tuổi</td><td>Đối chiếu nhanh nền tuổi, cưới hỏi, gia đạo</td><td>Chưa phản ánh đầy đủ giờ sinh và cấu trúc riêng từng lá số</td></tr>
                <tr><th scope="row">Tương hợp 2 lá số</th><td>Mệnh–Thân, Phu Thê, Phúc Đức, Tài Bạch, Quan Lộc và các cung sao liên quan</td><td>Giao tiếp, cam kết, tiền bạc, phân vai, đời sống chung</td><td>Cần giờ sinh gần đúng; vẫn phải kiểm chứng bằng hoàn cảnh thật</td></tr>
              </tbody>
            </table>
          </div>
          <p className="compatibility-table-note">Nếu chỉ có năm sinh, bạn có thể bắt đầu với <Link href="/xem-tuoi/vo-chong">công cụ xem tuổi vợ chồng</Link>. Khi có đủ ngày và giờ sinh, báo cáo hai lá số cho bối cảnh cá nhân sâu hơn.</p>
        </section>

        <section className="compatibility-static-section" aria-labelledby="compatibility-layers-title">
          <div className="compatibility-static-heading"><p>Không đọc một cung đơn lẻ</p><h2 id="compatibility-layers-title">Sáu lớp luận giải trong báo cáo</h2><span>Mỗi lớp ghép nhiều cung để tránh biến một sao thành kết luận chung cho cả quan hệ.</span></div>
          <div className="compatibility-layer-grid">
            {readingLayers.map((layer, index) => <article key={layer.title}><span>{index + 1}</span><h3>{layer.title}</h3><p>{layer.text}</p></article>)}
          </div>
        </section>

        <section className="compatibility-static-section compatibility-how" aria-labelledby="compatibility-how-title">
          <div className="compatibility-static-heading"><p>Cách đọc có ích</p><h2 id="compatibility-how-title">Bốn bước để dùng kết quả mà không bị ám bởi “hợp–khắc”</h2></div>
          <ol>
            <li><span>01</span><div><h3>Kiểm tra dữ liệu sinh</h3><p>Ngày, loại lịch và khung giờ sinh của cả hai càng gần đúng, cấu trúc cung sao càng đáng tin để đối chiếu.</p></div></li>
            <li><span>02</span><div><h3>Đọc bức tranh chung</h3><p>Nhìn số chủ đề thuận và chủ đề cần phối hợp, nhưng không dùng nhãn tổng quan thay cho sáu phần chi tiết.</p></div></li>
            <li><span>03</span><div><h3>Mở căn cứ lá số</h3><p>Kiểm tra cung, chính tinh, phụ tinh của từng người; giữ lại nhận định có liên hệ với trải nghiệm thật.</p></div></li>
            <li><span>04</span><div><h3>Chọn một cuộc trao đổi</h3><p>Thử một gợi ý nhỏ trong bảy ngày, cùng đánh giá lại thay vì dùng báo cáo để thắng một cuộc tranh luận.</p></div></li>
          </ol>
        </section>

        <section className="compatibility-safety" aria-labelledby="compatibility-safety-title">
          <ShieldCheck aria-hidden="true" size={27} />
          <div><h2 id="compatibility-safety-title">Giới hạn cần nhớ</h2><p>Kết quả tử vi là tài liệu tham khảo và không dùng để quyết định thay hai người về kết hôn, chia tay, góp vốn hoặc các lựa chọn quan trọng. Hành vi thực tế, sự tự nguyện, an toàn và trách nhiệm có giá trị cao hơn mọi ký hiệu cung sao. Khi quan hệ có kiểm soát, bạo lực hoặc rủi ro tài chính, hãy ưu tiên hỗ trợ chuyên môn phù hợp.</p></div>
        </section>

        <section className="compatibility-related" aria-labelledby="compatibility-related-title">
          <div className="compatibility-static-heading"><p>Đọc sâu có trình tự</p><h2 id="compatibility-related-title">Kiến thức giúp bạn hiểu căn cứ trong báo cáo</h2></div>
          <div>
            <Link href="/kien-thuc-tu-vi/cung-menh-cung-than"><Layers3 aria-hidden="true" size={21} /><span><strong>Cung Mệnh và Cung Thân</strong><small>Hiểu nền người và cách đi vào đời sống thực tế</small></span><ArrowRight aria-hidden="true" size={18} /></Link>
            <Link href="/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi"><HeartHandshake aria-hidden="true" size={21} /><span><strong>Cung Phu Thê trong tử vi</strong><small>Đọc kỳ vọng đồng hành mà không phán quyết hôn nhân</small></span><ArrowRight aria-hidden="true" size={18} /></Link>
            <Link href="/phuong-phap-luan"><BookOpenText aria-hidden="true" size={21} /><span><strong>Phương pháp luận</strong><small>Hiểu nguồn dữ liệu, giới hạn và nguyên tắc biên tập</small></span><ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
        </section>

        <section className="compatibility-faq" aria-labelledby="compatibility-faq-title">
          <div className="compatibility-static-heading"><p>Giải đáp trước khi nhập dữ liệu</p><h2 id="compatibility-faq-title">Câu hỏi thường gặp về tương hợp hai lá số</h2></div>
          <div>{faqs.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <footer className="compatibility-final-cta">
          <div><p>Muốn bắt đầu từ từng cá nhân?</p><h2>Lập lá số riêng rồi quay lại đối chiếu hai người</h2><span>Bạn có thể đọc Mệnh–Thân và các cung trọng yếu của mỗi người trước khi xem phần tương hợp.</span></div>
          <Link href="/#lap-la-so" className="btn btn-primary btn-large"><Sparkles aria-hidden="true" size={19} /> Lập lá số miễn phí</Link>
        </footer>

        <p className="compatibility-updated">Biên tập theo hướng tham khảo có căn cứ · Cập nhật <time dateTime="2026-08-04">04/08/2026</time></p>
      </div>
    </main>
  );
}
