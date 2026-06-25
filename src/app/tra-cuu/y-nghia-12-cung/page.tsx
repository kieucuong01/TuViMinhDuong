import { PseoHub } from "@/components/pseo-hub";
import { routeMetadata } from "@/lib/metadata";
import { PALACES } from "@/lib/pseo-registry";

export const metadata = routeMetadata({
  title: "Ý nghĩa 12 Cung trong lá số tử vi",
  description: "Tra cứu ý nghĩa Cung Mệnh, Tài Bạch, Quan Lộc, Phu Thê và toàn bộ 12 cung trong lá số.",
  path: "/tra-cuu/y-nghia-12-cung",
});

export default function PalacesHubPage() {
  return <PseoHub title="Ý nghĩa 12 Cung" description="Mỗi cung trả lời một nhóm câu hỏi khác nhau. Chọn đúng cung trước khi đọc sao." entities={PALACES} />;
}
