import { DateCountdownCard } from "@/components/date-countdown-card";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Bao nhiêu ngày nữa đến Giáng sinh?",
  description: "Đếm số ngày còn lại đến Giáng sinh ngày 25/12 dương lịch hằng năm.",
  path: "/xem-ngay/bao-nhieu-ngay-nua-den-giang-sinh",
});

export default function ChristmasCountdownPage() {
  return <DateCountdownCard kind="christmas" />;
}
