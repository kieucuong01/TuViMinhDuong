import Link from "next/link";

import { APP_NAME, APP_URL } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Thông tin về định hướng biên tập của Lá số tinh hoa: giải thích tử vi bằng tiếng Việt rõ ràng, có giới hạn và không hù dọa người đọc.";
const updatedAt = "21/07/2026";

export const metadata = routeMetadata({
  title: "Tác giả và đội ngũ biên tập",
  description,
  path: "/tac-gia",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: "Tác giả và đội ngũ biên tập",
  description,
  url: absoluteUrl("/tac-gia"),
  inLanguage: "vi-VN",
  dateModified: "2026-07-21",
  isPartOf: { "@type": "WebSite", name: APP_NAME, url: APP_URL },
  mainEntity: {
    "@type": "Organization",
    name: `Đội ngũ biên tập ${APP_NAME}`,
    url: APP_URL,
    description: "Biên tập nội dung tử vi tiếng Việt theo hướng giáo dục, dễ hiểu và có giới hạn tham khảo rõ ràng.",
  },
};

export default function TacGiaPage() {
  return (
    <main>
      <script id="author-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Tác giả</p>
          <h1>Tác giả và đội ngũ biên tập Lá số tinh hoa</h1>
          <p className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-5 text-lg font-semibold leading-8 text-stone-800" data-answer-block="true">Nội dung trên Lá số tinh hoa được biên tập theo hướng giáo dục: giải thích thuật ngữ, bối cảnh luận đoán và giới hạn sử dụng tử vi cho người đọc phổ thông. Đội ngũ ưu tiên văn phong dễ hiểu, tránh hù dọa, không cam kết kết quả cá nhân.</p>

          <div className="panel mt-8 space-y-5">
            <p className="text-lg leading-8 text-stone-700">
              Các bài viết công khai tập trung vào định nghĩa, cách đọc, ví dụ và điểm cần thận trọng. Khi nội dung có tính dự đoán, trang luôn đặt trong bối cảnh tham khảo thay vì xem như kết luận bắt buộc.
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
