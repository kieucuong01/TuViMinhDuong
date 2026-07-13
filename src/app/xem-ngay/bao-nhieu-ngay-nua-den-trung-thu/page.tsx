import { DateCountdownCard } from "@/components/date-countdown-card";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Bao nhiêu ngày nữa đến Trung thu?",
  description: "Đếm số ngày còn lại đến Tết Trung thu, rằm tháng 8 âm lịch theo lịch Việt Nam.",
  path: "/xem-ngay/bao-nhieu-ngay-nua-den-trung-thu",
});

export default function MidAutumnCountdownPage() {
  return <DateCountdownCard kind="midAutumn" />;
}
