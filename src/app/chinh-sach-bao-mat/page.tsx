import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Chính sách bảo mật",
  description: `${APP_NAME} minh bạch cách thu thập, dùng và bảo vệ thông tin khi bạn lập lá số tử vi, đăng nhập, nạp xu và mở luận giải.`,
  path: "/chinh-sach-bao-mat",
});

const sections = [
  {
    title: "Thông tin chúng tôi thu thập",
    paragraphs: [
      `${APP_NAME} chỉ thu thập thông tin cần thiết để tạo lá số, vận hành tài khoản và xử lý giao dịch. Khi bạn lập lá số, hệ thống có thể lưu họ tên hiển thị, giới tính, ngày giờ sinh, nơi sinh nếu bạn nhập, năm xem và các lựa chọn luận giải.`,
      "Khi bạn đăng nhập hoặc nạp xu, hệ thống lưu email, mã người dùng, lịch sử số dư xu, mã đơn hàng, trạng thái thanh toán và thời điểm giao dịch để đối soát.",
    ],
  },
  {
    title: "Mục đích sử dụng",
    bullets: [
      "Tạo và lưu lá số để bạn có thể xem lại trên cùng một tài khoản.",
      "Mở các phần luận giải đã thanh toán bằng xu và tránh trừ xu lặp lại.",
      "Đối soát giao dịch PayOS/VietQR, xử lý hỗ trợ, hoàn xu khi có lỗi kỹ thuật đủ điều kiện.",
      "Đo lường hiệu quả nội dung và quảng cáo ở mức tổng hợp để cải thiện trải nghiệm.",
    ],
  },
  {
    title: "Thanh toán và dữ liệu nhạy cảm",
    paragraphs: [
      `${APP_NAME} không lưu thông tin thẻ ngân hàng. Việc thanh toán được thực hiện qua cổng PayOS/VietQR; hệ thống chỉ nhận mã đơn, số tiền, trạng thái thanh toán và dữ liệu xác thực webhook để cộng xu.`,
      "Thông tin ngày giờ sinh là dữ liệu cá nhân có tính riêng tư. Chúng tôi dùng dữ liệu này cho mục đích lập lá số và luận giải trong sản phẩm, không bán dữ liệu cá nhân cho bên thứ ba.",
    ],
  },
  {
    title: "Cookie, phân tích và quảng cáo",
    paragraphs: [
      "Trang có thể dùng cookie hoặc mã đo lường như Google Analytics và Google Ads để hiểu luồng sử dụng, đo chuyển đổi và tối ưu chiến dịch. Các sự kiện mua hàng chỉ nên được ghi nhận sau khi đơn thanh toán đã được hệ thống xác minh.",
    ],
  },
  {
    title: "Lưu trữ, bảo mật và quyền của bạn",
    paragraphs: [
      "Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý để hạn chế truy cập trái phép vào tài khoản, đơn hàng và nội dung luận giải. Bạn có thể yêu cầu kiểm tra, cập nhật hoặc xóa dữ liệu tài khoản bằng cách liên hệ hỗ trợ.",
      "Một số dữ liệu giao dịch có thể cần được lưu trong thời gian hợp lý để đối soát, chống gian lận, xử lý khiếu nại hoặc đáp ứng yêu cầu pháp lý.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Bảo mật dữ liệu"
      title="Chính sách bảo mật"
      description="Chúng tôi giữ chính sách này rõ ràng để bạn biết dữ liệu nào được dùng, dùng vào việc gì và cách yêu cầu hỗ trợ khi cần."
      updatedAt="01/06/2026"
      sections={sections}
    />
  );
}
