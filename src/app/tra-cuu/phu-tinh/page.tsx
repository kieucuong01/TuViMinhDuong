import { PseoHub } from "@/components/pseo-hub";
import { routeMetadata } from "@/lib/metadata";
import { SUPPORT_STARS } from "@/lib/pseo-registry";

export const metadata = routeMetadata({
  title: "Tra cứu ý nghĩa Phụ Tinh trong tử vi",
  description: "Tìm hiểu Tuần, Triệt, Hóa Lộc, Hóa Quyền, Hóa Khoa và Hóa Kỵ trong đúng bối cảnh lá số.",
  path: "/tra-cuu/phu-tinh",
});

export default function SupportStarsHubPage() {
  return <PseoHub title="Tra cứu Phụ Tinh" description="Phụ tinh bổ sung sắc thái cho chính tinh và cung; không nên dùng riêng để kết luận." entities={SUPPORT_STARS} />;
}
