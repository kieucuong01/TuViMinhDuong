import { PseoLookupHub } from "@/components/pseo-lookup-hub";
import { routeMetadata } from "@/lib/metadata";
import { SUPPORT_STARS } from "@/lib/pseo-registry";

export const metadata = routeMetadata({
  title: "Tra cứu ý nghĩa Phụ Tinh trong tử vi",
  description: "Tìm hiểu Tuần, Triệt, Hóa Lộc, Hóa Quyền, Hóa Khoa và Hóa Kỵ trong đúng bối cảnh lá số.",
  path: "/tra-cuu/phu-tinh",
});

export default async function SupportStarsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ muc?: string | string[] }>;
}) {
  const muc = (await searchParams).muc;
  return (
    <PseoLookupHub
      title="Tra cứu ý nghĩa Phụ Tinh trong tử vi"
      description="Chọn một phụ tinh để hiểu vai trò bổ sung, mặt có thể phát huy và điểm cần thận trọng. Phụ tinh làm rõ sắc thái của cung và chính tinh, không nên được dùng riêng để kết luận."
      actionPath="/tra-cuu/phu-tinh"
      entities={SUPPORT_STARS}
      selectedSlug={typeof muc === "string" ? muc : undefined}
      formLabel="Chọn phụ tinh cần tra cứu"
      formHint="Bắt đầu từ phụ tinh đang đồng cung với chính tinh bạn quan tâm, hoặc sao đang được vận hiện tại kích hoạt rõ."
      resultContext="Phụ tinh có tác dụng bổ trợ, điều chỉnh hoặc làm nổi bật một mặt của cung. Cần xem sao này đi cùng chính tinh nào, thuộc nhóm hỗ trợ hay gây sức ép và đang xuất hiện ở lớp lá số gốc hay vận hạn."
      guideTitle="Cách đọc phụ tinh mà không kết luận vội"
      guideIntro="Phụ tinh thường dễ bị diễn giải thành một nhãn tốt hoặc xấu. Cách an toàn hơn là xác định vai trò, hệ sao đi cùng và biểu hiện có thể đối chiếu."
      steps={[
        { title: "Xác định vai trò của sao", body: "Phân biệt sao hỗ trợ, hóa tinh, sát tinh hoặc yếu tố chặn như Tuần - Triệt. Vai trò khác nhau sẽ dẫn tới cách đọc khác nhau." },
        { title: "Đọc chính tinh và cung trước", body: "Hãy hiểu nền của cung và chính tinh tọa thủ, rồi mới dùng phụ tinh để bổ sung chi tiết. Không đảo ngược thứ tự này." },
        { title: "Kiểm tra cả mặt thuận và mặt khó", body: "Một sao hỗ trợ vẫn có thể thành quá mức; một sao gây sức ép vẫn có thể tạo kỷ luật hoặc khả năng ứng phó nếu được quản trị tốt." },
      ]}
      principles={[
        { title: "Không gắn nhãn cát là tốt tuyệt đối", body: "Cát tinh thường mở thêm nguồn lực, nhưng kết quả còn tùy cách dùng, cung đang xét và các sao đi cùng." },
        { title: "Không gắn nhãn hung là tai họa chắc chắn", body: "Hung hoặc sát tinh mô tả áp lực và điểm cần quản trị, không phải lời khẳng định một biến cố nhất định sẽ xảy ra." },
        { title: "Tuần và Triệt cần đọc theo vị trí", body: "Tác dụng ngăn, chậm hoặc đổi hướng chỉ rõ khi biết sao nằm ở cung nào và đang tác động lên cấu trúc nào của lá số." },
      ]}
      faqs={[
        { question: "Phụ tinh có quan trọng bằng chính tinh không?", answer: "Hai nhóm có vai trò khác nhau. Chính tinh tạo trục đặc tính lớn, còn phụ tinh bổ sung sắc thái, điều kiện hỗ trợ hoặc áp lực. Muốn đọc sát phải xem cả hai." },
        { question: "Có nhiều cát tinh thì chắc chắn thuận lợi không?", answer: "Không chắc chắn. Cần xem cát tinh hỗ trợ việc gì, ở cung nào, có bị xung phá hay đi cùng sao gây quá mức không và người đó có sử dụng được nguồn lực hay không." },
        { question: "Gặp Hóa Kỵ, Tuần hoặc Triệt có nên lo không?", answer: "Không nên kết luận từ tên sao. Đây là tín hiệu để xem kỹ điểm vướng, độ chậm, sai lệch thông tin hoặc nhu cầu thay đổi cách làm trong đúng lĩnh vực của cung." },
      ]}
      indexTitle="Danh mục phụ tinh thường gặp"
      indexIntro="Danh mục tập trung vào các phụ tinh và yếu tố thường được người mới tìm kiếm. Dùng phần mô tả để nhận diện vai trò, sau đó đối chiếu với lá số cụ thể."
    />
  );
}
