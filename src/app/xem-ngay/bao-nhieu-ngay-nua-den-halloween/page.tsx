import { DateCountdownCard } from "@/components/date-countdown-card";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Bao nhiêu ngày nữa đến Halloween?",
  description: "Đếm số ngày còn lại đến Halloween ngày 31/10 dương lịch hằng năm.",
  path: "/xem-ngay/bao-nhieu-ngay-nua-den-halloween",
});

export default function HalloweenCountdownPage() {
  return <DateCountdownCard kind="halloween" />;
}
