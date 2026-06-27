import { PseoLookupHub } from "@/components/pseo-lookup-hub";
import { routeMetadata } from "@/lib/metadata";
import { MAIN_STARS } from "@/lib/pseo-registry";

export const metadata = routeMetadata({
  title: "Ý nghĩa 14 Chính Tinh trong tử vi",
  description: "Tra cứu đặc tính, ngũ hành, điểm mạnh và điều cần lưu ý của 14 chính tinh trong lá số tử vi.",
  path: "/tra-cuu/y-nghia-14-chinh-tinh",
});

export default async function MainStarsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ muc?: string | string[] }>;
}) {
  const muc = (await searchParams).muc;
  return (
    <PseoLookupHub
      title="Ý nghĩa 14 Chính Tinh trong tử vi"
      description="Tra cứu đặc tính nền, điểm mạnh và điều cần lưu ý của 14 chính tinh. Mỗi sao chỉ thật sự có nghĩa khi được đặt vào cung, trạng thái mạnh yếu và câu hỏi đời sống cụ thể."
      actionPath="/tra-cuu/y-nghia-14-chinh-tinh"
      entities={MAIN_STARS}
      selectedSlug={typeof muc === "string" ? muc : undefined}
      formLabel="Chọn chính tinh cần tra cứu"
      formHint="Chọn tên sao xuất hiện trong lá số của bạn. Nếu có nhiều sao nổi bật, hãy bắt đầu từ chính tinh tại Mệnh hoặc Thân."
      resultContext="Đây là đặc tính nền của chính tinh. Khi đi vào từng cung, cùng một đặc tính có thể biểu hiện thành năng lực, áp lực hoặc bài học khác nhau; trạng thái miếu, vượng, đắc, bình hay hãm cũng làm thay đổi sắc độ."
      guideTitle="Cách đọc chính tinh đúng bối cảnh"
      guideIntro="Tên sao là điểm bắt đầu, không phải kết luận. Ba bước dưới đây giúp nối đặc tính của sao với lá số và trải nghiệm có thể kiểm chứng."
      steps={[
        { title: "Nhận diện đặc tính nền", body: "Đọc mô tả, thế mạnh và điểm cần tiết chế để hiểu loại năng lượng mà sao đại diện, chưa vội gắn thành sự kiện tốt hay xấu." },
        { title: "Xác định sao đang ở cung nào", body: "Sao tại Mệnh nói khác sao tại Quan Lộc, Tài Bạch hay Phu Thê. Cung cho biết lĩnh vực mà đặc tính của sao đang tác động rõ nhất." },
        { title: "Ghép trạng thái và hệ sao", body: "Đối chiếu mức mạnh yếu, sao đồng cung, tam hợp, xung chiếu và vận hiện tại trước khi đưa ra nhận định thực tế." },
      ]}
      principles={[
        { title: "Không đọc tên sao theo nghĩa đen", body: "Tên gọi cổ không phải lời dự báo trực tiếp. Cần chuyển đặc tính của sao thành hành vi, nguồn lực và rủi ro trong đúng hoàn cảnh." },
        { title: "Một sao không đại diện toàn bộ con người", body: "Lá số gồm Mệnh, Thân, 12 cung, nhiều lớp sao và vận. Một chính tinh nổi bật vẫn chỉ là một phần của cấu trúc đó." },
        { title: "Mạnh không đồng nghĩa luôn thuận", body: "Sao mạnh có thể tạo năng lực rõ nhưng cũng làm điểm cực đoan rõ hơn. Cần xem người dùng năng lượng đó thế nào trong đời sống thật." },
      ]}
      faqs={[
        { question: "14 chính tinh gồm những sao nào?", answer: "Hệ 14 chính tinh gồm Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát và Phá Quân." },
        { question: "Một chính tinh có quyết định toàn bộ lá số không?", answer: "Không. Chính tinh cần đọc cùng cung đang tọa thủ, trạng thái mạnh yếu, phụ tinh, sao chiếu và vận. Tách riêng một sao rất dễ tạo nhận định chung chung." },
        { question: "Vì sao cùng một sao nhưng mỗi người lại khác nhau?", answer: "Vì sao có thể nằm ở cung khác nhau, đi cùng hệ sao khác nhau và được kích hoạt ở thời điểm khác nhau. Dữ kiện sinh và trải nghiệm thực tế cũng là phần cần đối chiếu." },
      ]}
      indexTitle="Danh mục đầy đủ 14 chính tinh"
      indexIntro="Đọc nhanh đặc tính nền của từng sao, sau đó dùng form để tập trung vào sao bạn đang gặp trong lá số."
    />
  );
}
