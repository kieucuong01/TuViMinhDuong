import { PseoLookupHub } from "@/components/pseo-lookup-hub";
import { redirect } from "next/navigation";
import { routeMetadata } from "@/lib/metadata";
import { PALACES, pseoEntityPath } from "@/lib/pseo-registry";

export const metadata = routeMetadata({
  title: "Ý nghĩa 12 Cung trong lá số tử vi",
  description: "Tra cứu ý nghĩa Cung Mệnh, Tài Bạch, Quan Lộc, Phu Thê và toàn bộ 12 cung trong lá số.",
  path: "/tra-cuu/y-nghia-12-cung",
});

export default async function PalacesHubPage({
  searchParams,
}: {
  searchParams: Promise<{ muc?: string | string[] }>;
}) {
  const muc = (await searchParams).muc;
  if (typeof muc === "string") {
    const entity = PALACES.find((item) => item.slug === muc);
    const target = entity ? pseoEntityPath(entity.kind, entity.slug) : undefined;
    if (target) redirect(target);
  }

  return (
    <PseoLookupHub
      title="Ý nghĩa 12 Cung trong lá số tử vi"
      description="Chọn một cung để tra cứu lĩnh vực đời sống mà cung đó đại diện, điểm nên quan sát và cách đặt cung vào toàn bộ lá số. Nội dung này giúp bạn tìm đúng nơi cần đọc, không dùng một cung riêng lẻ để phán đoán."
      actionPath="/tra-cuu/y-nghia-12-cung"
      entities={PALACES}
      selectedSlug={typeof muc === "string" ? muc : undefined}
      formLabel="Chọn cung cần tra cứu"
      formHint="Bạn có thể bắt đầu từ Cung Mệnh, hoặc chọn cung sát với câu hỏi hiện tại như Quan Lộc, Tài Bạch hay Phu Thê."
      resultContext="Cung cho biết vùng đời sống đang được xem xét, nhưng mức độ thuận hay khó còn phụ thuộc vào chính tinh, phụ tinh, trạng thái sao, tam hợp, xung chiếu và vận đang tác động."
      guideTitle="Cách chọn cung theo câu hỏi thật"
      guideIntro="Tra cứu 12 cung hiệu quả nhất khi bạn bắt đầu bằng một vấn đề cụ thể, sau đó mở rộng sang các cung có liên hệ thay vì đọc từng ô tách rời."
      steps={[
        { title: "Xác định câu hỏi", body: "Công việc thường bắt đầu ở Quan Lộc; tiền bạc ở Tài Bạch; quan hệ hôn nhân ở Phu Thê; nhà cửa và tích lũy dài hạn ở Điền Trạch." },
        { title: "Đọc trục liên quan", body: "Sau cung chính, đối chiếu Mệnh - Thân và các cung tam hợp hoặc xung chiếu để thấy nguồn lực, môi trường và điểm gây áp lực." },
        { title: "Đặt vào thời điểm", body: "Cuối cùng mới xem đại vận, tiểu vận hoặc năm đang hỏi. Một cung có nền tốt vẫn có giai đoạn cần chậm lại và quản trị rủi ro." },
      ]}
      principles={[
        { title: "Không có cung tốt hoặc xấu tuyệt đối", body: "Mỗi cung mô tả một lĩnh vực. Giá trị thực tế đến từ cách các sao, thế cung và vận kết hợp trong đúng hoàn cảnh." },
        { title: "Luôn nối với Mệnh và Thân", body: "Mệnh cho biết nền tính cách, Thân cho biết cách đi vào đời sống. Hai trục này giúp tránh diễn giải một cung theo kiểu ai cũng giống nhau." },
        { title: "Ưu tiên việc có thể đối chiếu", body: "Hãy dùng sự kiện đã xảy ra và câu hỏi hiện tại để kiểm tra cách đọc. Không nên dùng một câu mô tả chung để quyết định thay cho dữ kiện thực tế." },
      ]}
      faqs={[
        { question: "12 cung tử vi nên đọc cung nào trước?", answer: "Người mới nên đọc Mệnh và Thân trước, sau đó chọn cung liên quan trực tiếp đến câu hỏi. Khi hỏi nghề nghiệp, nối Quan Lộc với Tài Bạch và Thiên Di; khi hỏi quan hệ, nối Phu Thê với Mệnh và Phúc Đức." },
        { question: "Một cung không có chính tinh có phải là xấu không?", answer: "Không. Cung vô chính diệu vẫn cần xem sao chiếu, phụ tinh, vòng trạng thái và các cung liên hệ. Không thể kết luận chỉ từ việc có hay không có chính tinh." },
        { question: "Có thể tự xem 12 cung mà chưa lập lá số không?", answer: "Bạn có thể học ý nghĩa nền, nhưng muốn áp dụng cho bản thân thì cần lá số đúng ngày, giờ, giới tính và loại lịch để xác định vị trí cung và sao." },
      ]}
      indexTitle="Danh mục đầy đủ 12 cung tử vi"
      indexIntro="Danh mục dưới đây giúp bạn nhận diện phạm vi của từng cung. Chọn trong form phía trên để xem điểm mạnh, lưu ý và đường dẫn phân tích riêng."
    />
  );
}
