import { DateCountdownCard } from "@/components/date-countdown-card";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Bao nhiêu ngày nữa đến Tết?",
  description: "Đếm số ngày còn lại đến Tết Nguyên đán gần nhất theo lịch Việt Nam.",
  path: "/xem-ngay/bao-nhieu-ngay-nua-den-tet",
});

export default function TetCountdownPage() {
  return <DateCountdownCard kind="tet" />;
}
