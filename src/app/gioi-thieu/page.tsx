import Link from "next/link";

import { APP_NAME, APP_URL } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Giới thiệu Lá số tinh hoa, công cụ lập lá số tử vi miễn phí và thư viện kiến thức tử vi tiếng Việt theo hướng tham khảo, bình tĩnh, có bối cảnh.";
const updatedAt = "21/07/2026";

export const metadata = routeMetadata({
  title: `Giới thiệu ${APP_NAME}`,
  description,
  path: "/gioi-thieu",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: `Giới thiệu ${APP_NAME}`,
      description,
      url: absoluteUrl("/gioi-thieu"),
      inLanguage: "vi-VN",
      dateModified: "2026-07-21",
      isPartOf: { "@type": "WebSite", name: APP_NAME, url: APP_URL },
      about: { "@type": "Organization", name: APP_NAME, url: APP_URL },
    },
    {
      "@type": "Organization",
      name: APP_NAME,
      alternateName: ["La so tinh hoa", "Lá số"],
      url: APP_URL,
      logo: `${APP_URL}/favicon-96x96.png`,
    },
  ],
};

export default function GioiThieuPage() {
  return (
    <main>
      <script id="about-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Giới thiệu</p>
          <h1>Lá số tinh hoa là gì?</h1>
          <p className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-5 text-lg font-semibold leading-8 text-stone-800" data-answer-block="true">Lá số tinh hoa là website tiếng Việt giúp người đọc lập lá số tử vi miễn phí, tra cứu kiến thức nền tảng và xem ngày, xem tuổi theo hướng tham khảo. Trang ưu tiên cách giải thích bình tĩnh, có bối cảnh, để người dùng tự đối chiếu thay vì nhận lời phán chắc chắn.</p>

          <div className="panel mt-8 space-y-5">
            <p className="text-lg leading-8 text-stone-700">
              Website được xây cho người muốn bắt đầu từ thông tin sinh cơ bản, lập lá số rõ ràng, rồi đọc thêm các khái niệm như cung Mệnh, chính tinh, phụ tinh, đại vận và các công cụ xem ngày hoặc xem tuổi.
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
