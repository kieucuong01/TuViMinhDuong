import { redirect } from "next/navigation";

import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Chính sách thanh toán và hoàn xu",
  description: `Chính sách thanh toán, cộng xu, hoàn xu và hỗ trợ giao dịch PayOS/VietQR trên ${APP_NAME}.`,
  path: "/chinh-sach-thanh-toan-hoan-xu",
  robots: { index: false, follow: false },
});

const sections = [
  {
    title: "Đơn vị xu và gói nạp",
    paragraphs: [
      "Trên hệ thống, 1 xu tương ứng 1.000đ. Các gói nạp, số xu nhận được, xu tặng nếu có và giá tiền được hiển thị trước khi bạn tạo đơn thanh toán.",
      "Xu dùng để mở các phần luận giải chuyên sâu như luận toàn bộ, luận cung, đại vận, tiểu vận, nguyệt vận hoặc nhật vận theo bảng giá đang hiển thị.",
    ],
  },
  {
    title: "Quy trình thanh toán",
    bullets: [
      "Bạn chọn gói xu và tạo đơn thanh toán trên tài khoản đã đăng nhập.",
      "Hệ thống chuyển sang PayOS/VietQR để bạn thanh toán qua ngân hàng hoặc phương thức được hỗ trợ.",
      "Sau khi PayOS gửi webhook hợp lệ và đơn được xác minh đã thanh toán, hệ thống cộng xu vào tài khoản.",
      "Trang quay lại sau thanh toán chỉ là bước thông báo; số xu và chuyển đổi mua hàng được xác nhận theo trạng thái đơn trong hệ thống.",
    ],
  },
  {
    title: "Khi nào được hoàn xu",
    bullets: [
      "Đã bị trừ xu nhưng quá trình tạo luận giải lỗi kỹ thuật và nội dung không được mở.",
      "Thanh toán đã thành công nhưng hệ thống không cộng xu sau thời gian đối soát hợp lý.",
      "Giao dịch bị ghi nhận sai gói, sai số xu hoặc sai tài khoản do lỗi hệ thống.",
    ],
  },
  {
    title: "Trường hợp không hoàn",
    paragraphs: [
      "Nội dung luận giải đã mở thành công thường không được hoàn xu chỉ vì bạn đổi ý hoặc không đồng ý với diễn giải. Tử vi là nội dung tham khảo, không phải cam kết kết quả tuyệt đối.",
      "Chúng tôi có thể từ chối hoàn xu nếu phát hiện lạm dụng, gian lận, chia sẻ tài khoản bất thường hoặc cố tình khai thác lỗi.",
    ],
  },
  {
    title: "Cách gửi yêu cầu hỗ trợ",
    paragraphs: [
      "Khi cần kiểm tra giao dịch, hãy gửi email đăng nhập, mã đơn hàng, thời gian thanh toán, số tiền và ảnh chụp biên lai nếu có. Đội ngũ sẽ kiểm tra trạng thái webhook, lịch sử xu và nội dung đã mở để xử lý.",
    ],
  },
];

export default async function PaymentRefundPolicyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/chinh-sach-thanh-toan-hoan-xu");

  return (
    <LegalPage
      eyebrow="Thanh toán"
      title="Chính sách thanh toán và hoàn xu"
      description="Chính sách này giải thích cách xu được cộng, khi nào được hoàn xu và cách gửi yêu cầu hỗ trợ nếu giao dịch gặp lỗi."
      updatedAt="01/06/2026"
      sections={sections}
    />
  );
}
