import Link from "next/link";

import { APP_NAME, APP_URL } from "@/lib/env";
import { EDITORIAL_ORGANIZATION } from "@/lib/editorial-identity";
import { routeMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Chính sách biên tập của Lá số tinh hoa về nguồn tham khảo, kiểm tra nội dung, đính chính, quyền riêng tư và tính độc lập thương mại.";

export const metadata = routeMetadata({
  title: "Chính sách biên tập",
  description,
  path: "/chinh-sach-bien-tap",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Chính sách biên tập",
  description,
  url: absoluteUrl("/chinh-sach-bien-tap"),
  inLanguage: "vi-VN",
  dateModified: "2026-07-29",
  isPartOf: { "@type": "WebSite", name: APP_NAME, url: APP_URL },
  publisher: {
    "@type": "Organization",
    "@id": EDITORIAL_ORGANIZATION.url,
    name: EDITORIAL_ORGANIZATION.name,
    url: EDITORIAL_ORGANIZATION.url,
  },
};

export default function ChinhSachBienTapPage() {
  return (
    <main>
      <script
        id="editorial-policy-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Minh bạch nội dung</p>
          <h1>Chính sách biên tập của Lá số tinh hoa</h1>
          <p className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-5 text-lg font-semibold leading-8 text-stone-800" data-answer-block="true">
            Chính sách biên tập của Lá số tinh hoa yêu cầu nội dung nêu rõ nguồn tham khảo, phân biệt kiến thức chung với luận giải cá nhân, kiểm tra trước khi xuất bản và công khai cách đính chính. Hoạt động biên tập độc lập với quảng cáo, thanh toán và mọi cam kết kết quả.
          </p>

          <div className="panel mt-8 space-y-7 text-lg leading-8 text-stone-700">
            <section aria-labelledby="policy-sources">
              <h2 id="policy-sources" className="text-2xl font-bold text-stone-900">Nguồn tham khảo và cách kiểm tra</h2>
              <p className="mt-3">
                Nội dung được xây dựng từ hệ thống thuật ngữ tử vi, tài liệu giải thích theo chủ đề và dữ liệu đã được chuẩn hóa trong sản phẩm. Người biên tập đối chiếu cách gọi cung sao, phạm vi nhận định và liên kết nội bộ trước khi xuất bản; thông tin không đủ căn cứ sẽ không được trình bày như sự thật chắc chắn.
              </p>
            </section>

            <section aria-labelledby="policy-corrections">
              <h2 id="policy-corrections" className="text-2xl font-bold text-stone-900">Cập nhật và đính chính</h2>
              <p className="mt-3">
                Khi phát hiện lỗi về dữ kiện, thuật ngữ, liên kết hoặc cách diễn đạt, đội ngũ sẽ kiểm tra lại nguồn, sửa nội dung và cập nhật ngày chỉnh sửa khi thay đổi có ý nghĩa. Để yêu cầu kiểm tra, vui lòng gửi URL cùng đoạn liên quan qua{" "}
                <Link className="font-semibold text-orange-700 underline underline-offset-4" href="/lien-he">
                  trang liên hệ
                </Link>.
              </p>
            </section>

            <section aria-labelledby="policy-independence">
              <h2 id="policy-independence" className="text-2xl font-bold text-stone-900">Độc lập thương mại và quyền riêng tư</h2>
              <p className="mt-3">
                Quyết định biên tập độc lập với việc người đọc mua gói luận giải, nạp xu hay sử dụng dịch vụ trả phí. Thanh toán không làm thay đổi kết luận biên tập và không tạo cam kết kết quả. Dữ liệu người dùng được xử lý theo{" "}
                <Link className="font-semibold text-orange-700 underline underline-offset-4" href="/chinh-sach-bao-mat">
                  chính sách bảo mật
                </Link>.
              </p>
            </section>

            <section aria-labelledby="policy-agents">
              <h2 id="policy-agents" className="text-2xl font-bold text-stone-900">Tài nguyên cho công cụ và AI agent</h2>
              <p className="mt-3">
                Các công cụ tự động có thể đọc bản mô tả website tại{" "}
                <Link className="font-semibold text-orange-700 underline underline-offset-4" href="/agent/site.json">
                  agent/site.json
                </Link>{" "}
                và thông tin giá công khai tại{" "}
                <Link className="font-semibold text-orange-700 underline underline-offset-4" href="/agent/pricing.json">
                  agent/pricing.json
                </Link>. Hai tài nguyên này không chứa thông tin tài khoản hoặc dữ liệu cá nhân.
              </p>
            </section>

            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
              Nội dung chỉ mang tính tham khảo, không cam kết vận mệnh, sức khỏe, tài chính hoặc hôn nhân.
            </p>
            <p className="text-sm text-stone-500">
              <time dateTime="2026-07-29">Cập nhật lần cuối: 29/07/2026</time>
            </p>
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
