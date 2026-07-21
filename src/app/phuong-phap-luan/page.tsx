import Link from "next/link";

import { APP_NAME, APP_URL } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Phương pháp luận của Lá số tinh hoa khi trình bày tử vi: đọc theo bối cảnh cung sao, tránh kết luận tuyệt đối và luôn nêu giới hạn tham khảo.";
const updatedAt = "21/07/2026";

export const metadata = routeMetadata({
  title: "Phương pháp luận giải tử vi",
  description,
  path: "/phuong-phap-luan",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Phương pháp luận giải tử vi",
  description,
  url: absoluteUrl("/phuong-phap-luan"),
  inLanguage: "vi-VN",
  dateModified: "2026-07-21",
  isPartOf: { "@type": "WebSite", name: APP_NAME, url: APP_URL },
  about: [
    "Lập lá số tử vi",
    "Luận giải cung sao",
    "Đối chiếu đại vận và bối cảnh cá nhân",
  ],
};

export default function PhuongPhapLuanPage() {
  return (
    <main>
      <script id="method-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Phương pháp luận</p>
          <h1>Phương pháp luận giải tử vi trên Lá số tinh hoa</h1>
          <p className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-5 text-lg font-semibold leading-8 text-stone-800" data-answer-block="true">Phương pháp luận của Lá số tinh hoa dựa trên dữ liệu lá số, hệ thống cung sao, đại vận, tiểu vận và các nguyên tắc đối chiếu truyền thống. Mỗi nhận định được trình bày như gợi ý tham khảo, có giới hạn rõ, không thay thế quyết định chuyên môn về sức khỏe, tài chính hay hôn nhân.</p>

          <div className="panel mt-8 space-y-5">
            <p className="text-lg leading-8 text-stone-700">
              Khi đọc một lá số, nội dung ưu tiên quan hệ giữa cung, sao, vị trí, vận và câu hỏi của người đọc. Một sao không được tách riêng để kết luận toàn bộ tính cách, tiền bạc, gia đạo hoặc sức khỏe.
            </p>
            <p className="text-lg leading-8 text-stone-700">
              Các phần tra cứu và bài viết được viết theo hướng giải thích nguyên lý trước, ví dụ sau, rồi nhắc người đọc quay lại dữ liệu lá số cá nhân để tự đối chiếu.
            </p>
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
              Nội dung chỉ mang tính tham khảo, không cam kết vận mệnh, sức khỏe, tài chính hoặc hôn nhân.
            </p>
            <p className="text-sm text-stone-500">Cập nhật lần cuối: {updatedAt}</p>
          </div>

          <nav className="mt-8 flex flex-wrap gap-3" aria-label="Liên kết nội bộ">
            <Link className="btn btn-primary" href="/" prefetch={false}>Lập lá số miễn phí</Link>
            <Link className="btn btn-ghost" href="/kien-thuc-tu-vi" prefetch={false}>Kiến thức tử vi</Link>
            <Link className="btn btn-ghost" href="/tra-cuu" prefetch={false}>Tra cứu</Link>
            <Link className="btn btn-ghost" href="/xem-ngay" prefetch={false}>Xem ngày</Link>
            <Link className="btn btn-ghost" href="/xem-tuoi" prefetch={false}>Xem tuổi</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
