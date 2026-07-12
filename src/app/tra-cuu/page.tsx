import Link from "next/link";
import { ArrowRight, BookOpenText, Orbit, Sparkles } from "lucide-react";
import { routeMetadata } from "@/lib/metadata";
import { itemListJsonLd, webPageJsonLd } from "@/lib/seo";

export const metadata = routeMetadata({
  title: "Tra cứu ý nghĩa sao và 12 cung tử vi",
  description: "Tra cứu 14 chính tinh, 12 cung, phụ tinh và các tổ hợp sao tại từng cung trong lá số tử vi.",
  path: "/tra-cuu",
});

const hubs = [
  {
    href: "/tra-cuu/y-nghia-14-chinh-tinh",
    title: "Ý nghĩa 14 Chính Tinh",
    description: "Hiểu đặc tính nền của Tử Vi, Thái Âm, Thất Sát và các chính tinh.",
    icon: Sparkles,
  },
  {
    href: "/tra-cuu/y-nghia-12-cung",
    title: "Ý nghĩa 12 Cung",
    description: "Đọc đúng vai trò của Mệnh, Tài Bạch, Quan Lộc và các cung đời sống.",
    icon: Orbit,
  },
  {
    href: "/tra-cuu/phu-tinh",
    title: "Tra cứu Phụ Tinh",
    description: "Đặt Tuần, Triệt, Hóa Lộc, Hóa Kỵ vào đúng bối cảnh.",
    icon: BookOpenText,
  },
];

export default function LookupHubPage() {
  const pageLd = webPageJsonLd({
    name: "Tra cứu ý nghĩa sao và 12 cung tử vi",
    description: "Tra cứu 14 chính tinh, 12 cung, phụ tinh và các tổ hợp sao tại từng cung trong lá số tử vi.",
    url: "/tra-cuu",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Tra cứu tử vi", url: "/tra-cuu" },
    ],
  });
  const listLd = itemListJsonLd(hubs.map((hub) => ({ name: hub.title, url: hub.href })));

  return (
    <main className="pseo-hub pseo-root-hub section">
      <script id="lookup-root-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="lookup-root-list-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header>
          <h1>Tra cứu tử vi theo sao và cung</h1>
          <p>Chọn một hub để đi từ kiến thức nền tới đúng tổ hợp đang xuất hiện trong lá số của bạn.</p>
        </header>

        <div className="pseo-root-grid" aria-label="Các nhóm tra cứu tử vi">
          {hubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link key={hub.href} href={hub.href}>
                <Icon aria-hidden="true" size={30} />
                <h2>{hub.title}</h2>
                <p>{hub.description}</p>
                <span>
                  Mở trang tra cứu
                  <ArrowRight size={18} />
                </span>
              </Link>
            );
          })}
        </div>

        <section className="pseo-root-guide" aria-labelledby="pseo-root-guide-title">
          <div>
            <h2 id="pseo-root-guide-title">Cách dùng thư viện tra cứu</h2>
            <p>Tra cứu giúp bạn hiểu từng lớp thông tin trước khi đối chiếu với toàn bộ lá số.</p>
          </div>
          <ol>
            <li>
              <strong>Chọn đúng lớp dữ liệu</strong>
              <span>Bắt đầu từ sao, cung hoặc phụ tinh bạn đang thấy.</span>
            </li>
            <li>
              <strong>Đặt vào đúng bối cảnh</strong>
              <span>Không kết luận từ một tên sao đứng riêng.</span>
            </li>
            <li>
              <strong>Đối chiếu lá số cá nhân</strong>
              <span>Dùng ngày giờ sinh để xem vị trí và tổ hợp thực tế.</span>
            </li>
          </ol>
          <Link href="/#lap-la-so" className="btn btn-primary">
            Lập lá số miễn phí
          </Link>
        </section>
      </div>
    </main>
  );
}
