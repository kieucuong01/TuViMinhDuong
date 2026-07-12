import { BirthHourComparison } from "@/components/birth-hour-comparison";
import { routeMetadata } from "@/lib/metadata";
import { webPageJsonLd } from "@/lib/seo";

export const metadata = routeMetadata({
  title: "Không nhớ giờ sinh: so sánh 12 khung giờ",
  description:
    "Beta so sánh 12 khung giờ sinh để xem Mệnh, Thân, Cục, cân lượng và vị trí sao nào ổn định hoặc thay đổi trước khi lập lá số.",
  path: "/lap-la-so/khong-nho-gio-sinh",
  imageSubtitle: "So sánh 12 giờ sinh, không tự đoán giờ sinh chính xác",
  robots: { index: false, follow: true },
});

export default function UnknownBirthHourPage() {
  const pageLd = webPageJsonLd({
    name: "Không nhớ giờ sinh: so sánh 12 khung giờ",
    description:
      "Beta so sánh 12 khung giờ sinh để xem phần nào của lá số ổn định hoặc thay đổi, sau đó người dùng tự chọn giờ để lập lá số.",
    url: "/lap-la-so/khong-nho-gio-sinh",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Lập lá số", url: "/lap-la-so" },
      { name: "Không nhớ giờ sinh", url: "/lap-la-so/khong-nho-gio-sinh" },
    ],
  });

  return (
    <main className="birth-hour-page bg-[#fbfaf7]">
      <script id="unknown-birth-hour-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BirthHourComparison />
      </div>
    </main>
  );
}
