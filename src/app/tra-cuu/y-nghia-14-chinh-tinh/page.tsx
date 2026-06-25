import { PseoHub } from "@/components/pseo-hub";
import { routeMetadata } from "@/lib/metadata";
import { MAIN_STARS } from "@/lib/pseo-registry";

export const metadata = routeMetadata({
  title: "Ý nghĩa 14 Chính Tinh trong tử vi",
  description: "Tra cứu đặc tính, ngũ hành, điểm mạnh và điều cần lưu ý của 14 chính tinh trong lá số tử vi.",
  path: "/tra-cuu/y-nghia-14-chinh-tinh",
});

export default function MainStarsHubPage() {
  return <PseoHub title="Ý nghĩa 14 Chính Tinh" description="Mỗi chính tinh là một lớp năng lượng. Hãy đọc cùng cung, trạng thái sao và bối cảnh thực tế." entities={MAIN_STARS} />;
}
