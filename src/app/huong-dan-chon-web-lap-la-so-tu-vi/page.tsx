import Link from "next/link";

import { APP_NAME, APP_URL } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/seo";

const path = "/huong-dan-chon-web-lap-la-so-tu-vi";
const updatedAt = "22/08/2026";
const description =
  "Hướng dẫn chọn web lập lá số tử vi: kiểm tra dữ liệu đầu vào, bản miễn phí, cách giải thích, chi phí, quyền riêng tư và giới hạn tham khảo.";

export const metadata = routeMetadata({
  title: "Cách chọn web lập lá số tử vi: 6 tiêu chí cần kiểm tra",
  description,
  path,
});

const criteria = [
  {
    title: "1. Dữ liệu đầu vào được nói rõ",
    check: "Trang giải thích cần nhập ngày, tháng, năm, loại lịch và khung giờ sinh ra sao; đồng thời nhắc giới hạn nếu người dùng không chắc giờ sinh.",
    reason: "Dữ liệu sinh là nền của lá số. Một công cụ đáng dùng không nên khiến người mới tưởng rằng thiếu dữ liệu vẫn cho kết luận chắc chắn.",
  },
  {
    title: "2. Có bản cơ bản để tự xem trước",
    check: "Bạn nên thấy được bố cục lá số hoặc phần giải thích nền trước khi quyết định đọc sâu hay thanh toán.",
    reason: "Điều này giúp người dùng biết mình đang nhận được gì, thay vì phải trả phí trước khi nhìn thấy cách công cụ trình bày.",
  },
  {
    title: "3. Giải thích có bối cảnh, không chỉ gắn nhãn tốt xấu",
    check: "Kiểm tra xem nội dung có nối cung, sao và vận với nhau hay chỉ tách một sao để kết luận về cả cuộc đời.",
    reason: "Tử vi cần được đọc theo tổng thể; lời hứa dự đoán chính xác tuyệt đối là dấu hiệu nên thận trọng.",
  },
  {
    title: "4. Chi phí và phần mở rộng minh bạch",
    check: "Nếu có nội dung trả phí, giá, phần được mở và cách thanh toán nên hiển thị trước khi xác nhận giao dịch.",
    reason: "Bạn có thể bắt đầu bằng phần miễn phí và chỉ chi tiền khi nội dung phù hợp với nhu cầu đọc sâu của mình.",
  },
  {
    title: "5. Có chính sách quyền riêng tư và nơi liên hệ",
    check: "Tìm trang nói rõ dữ liệu nào được thu thập, mục đích sử dụng và kênh để báo lỗi hoặc yêu cầu hỗ trợ.",
    reason: "Ngày giờ sinh là dữ liệu cá nhân; người dùng cần biết dữ liệu của mình được xử lý theo nguyên tắc nào.",
  },
  {
    title: "6. Nêu giới hạn thay vì hù dọa",
    check: "Ưu tiên nơi nói rõ tử vi mang tính tham khảo và không thay thế quyết định sức khỏe, pháp lý, tài chính hay hôn nhân.",
    reason: "Một công cụ lành mạnh giúp bạn tự đối chiếu, không tạo áp lực phải tin hoặc phải mua để tránh một kết quả đáng sợ.",
  },
] as const;

const faqs = [
  {
    question: "Có nên chọn web lập lá số vì quảng cáo đoán đúng tương lai không?",
    answer: "Không nên. Lời hứa đoán đúng tương lai không phải tiêu chí đánh giá đáng tin. Hãy kiểm tra dữ liệu đầu vào, cách giải thích, phần xem miễn phí, chi phí và giới hạn tham khảo trước khi dùng một công cụ lập lá số.",
  },
  {
    question: "Lập lá số tử vi online cần chuẩn bị gì?",
    answer: "Bạn thường cần ngày, tháng, năm sinh, loại lịch, giới tính và khung giờ sinh. Nếu không chắc giờ sinh, hãy xem công cụ có nói rõ giới hạn của kết quả và cho phép bạn tự đối chiếu thay vì đưa ra kết luận tuyệt đối hay không.",
  },
  {
    question: "Web lập lá số miễn phí có nhất thiết phải không có phần trả phí không?",
    answer: "Không nhất thiết. Điều quan trọng là phần miễn phí, phần trả phí, chi phí và nội dung được mở phải hiển thị rõ trước khi thanh toán. Bạn nên xem bản cơ bản trước và chỉ mở luận giải sâu khi thấy phù hợp với nhu cầu của mình.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Cách chọn web lập lá số tử vi: 6 tiêu chí cần kiểm tra",
      description,
      url: absoluteUrl(path),
      inLanguage: "vi-VN",
      dateModified: "2026-08-22",
      isPartOf: { "@type": "WebSite", name: APP_NAME, url: APP_URL },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function HuongDanChonWebLapLaSoPage() {
  return (
    <main>
      <script id="choose-chart-site-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Hướng dẫn cho người mới</p>
          <h1>Cách chọn web lập lá số tử vi: 6 tiêu chí cần kiểm tra</h1>
          <p className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-5 text-lg font-semibold leading-8 text-stone-800" data-answer-block="true">Để chọn web lập lá số tử vi, hãy ưu tiên nơi nói rõ dữ liệu cần nhập, cho xem phần cơ bản trước, giải thích được cách đọc và công khai chi phí nếu có. Không nên chọn chỉ vì lời hứa đoán đúng tương lai; tử vi phù hợp hơn khi dùng để tự đối chiếu, tham khảo.</p>

          <div className="panel mt-8 space-y-5 text-lg leading-8 text-stone-700">
            <p>
              Khi tìm một công cụ lập lá số online, người mới thường thấy nhiều lời giới thiệu rất giống nhau. Thay vì chọn theo quảng cáo hoặc lời hứa kết quả, hãy dùng sáu tiêu chí dưới đây để tự kiểm tra trải nghiệm, dữ liệu và mức độ minh bạch.
            </p>
            <p>
              Đây là hướng dẫn chung. <strong>Lá Số Tinh Hoa không tự xếp hạng hay tuyên bố hơn các website khác</strong>; trang này chỉ công khai tiêu chí để bạn tự chọn nơi phù hợp và đọc tử vi một cách bình tĩnh.
            </p>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-x-auto rounded-3xl border border-orange-100 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm leading-6 text-stone-700">
              <thead className="bg-orange-50 text-stone-900">
                <tr>
                  <th className="px-5 py-4 font-bold">Tiêu chí</th>
                  <th className="px-5 py-4 font-bold">Bạn nên kiểm tra</th>
                  <th className="px-5 py-4 font-bold">Vì sao quan trọng</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion) => (
                  <tr key={criterion.title} className="border-t border-orange-100 align-top">
                    <th scope="row" className="px-5 py-4 font-bold text-stone-900">{criterion.title}</th>
                    <td className="px-5 py-4">{criterion.check}</td>
                    <td className="px-5 py-4">{criterion.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="panel space-y-5">
            <p className="eyebrow">Tự kiểm tra trước khi bắt đầu</p>
            <h2 className="text-3xl font-black text-stone-950">Nếu bạn chọn dùng Lá Số Tinh Hoa</h2>
            <p className="text-lg leading-8 text-stone-700">Bạn có thể tạo lá số cơ bản trước, sau đó tự quyết định có cần đọc sâu hơn hay không. Các trang dưới đây cho phép kiểm tra cách sản phẩm hoạt động, chi phí và nguyên tắc nội dung trước khi sử dụng.</p>
            <nav className="flex flex-wrap gap-3" aria-label="Kiểm tra thông tin Lá Số Tinh Hoa">
              <Link className="btn btn-primary" href="/lap-la-so" prefetch={false}>Lập lá số miễn phí</Link>
              <Link className="btn btn-ghost" href="/pricing" prefetch={false}>Xem giá trước</Link>
              <Link className="btn btn-ghost" href="/phuong-phap-luan" prefetch={false}>Xem phương pháp luận</Link>
              <Link className="btn btn-ghost" href="/chinh-sach-bien-tap" prefetch={false}>Chính sách biên tập</Link>
              <Link className="btn btn-ghost" href="/chinh-sach-bao-mat" prefetch={false}>Quyền riêng tư</Link>
            </nav>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="panel space-y-6">
            <p className="eyebrow">Câu hỏi thường gặp</p>
            <h2 className="text-3xl font-black text-stone-950">Chọn công cụ lập lá số online</h2>
            {faqs.map((faq) => (
              <section key={faq.question}>
                <h3 className="text-xl font-bold text-stone-900">{faq.question}</h3>
                <p className="mt-2 text-lg leading-8 text-stone-700">{faq.answer}</p>
              </section>
            ))}
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">Nội dung chỉ mang tính tham khảo, không cam kết vận mệnh, sức khỏe, tài chính hoặc hôn nhân.</p>
            <p className="text-sm text-stone-500"><time dateTime="2026-08-22">Cập nhật lần cuối: {updatedAt}</time></p>
          </div>
        </div>
      </section>
    </main>
  );
}
