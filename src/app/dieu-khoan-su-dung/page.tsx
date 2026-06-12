import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";
import { webPageJsonLd } from "@/lib/seo";

export const metadata = routeMetadata({
  title: "Điều khoản sử dụng",
  description: `Điều khoản sử dụng ${APP_NAME}: phạm vi nội dung tử vi tham khảo, tài khoản, xu, thanh toán và trách nhiệm khi dùng dịch vụ.`,
  path: "/dieu-khoan-su-dung",
});

const sections = [
  {
    title: "Phạm vi dịch vụ",
    paragraphs: [
      `${APP_NAME} cung cấp công cụ lập lá số tử vi, xem ngày tốt xấu, bài viết kiến thức và các phần luận giải có thể mở bằng xu. Nội dung được trình bày để tham khảo, tự soi chiếu và hỗ trợ định hướng cá nhân.`,
      "Tử vi không thay thế tư vấn y tế, pháp lý, tài chính, tâm lý hoặc quyết định chuyên môn khác. Bạn vẫn là người chịu trách nhiệm cuối cùng cho lựa chọn của mình.",
    ],
  },
  {
    title: "Tài khoản và bảo mật",
    bullets: [
      "Bạn cần dùng email hợp lệ khi đăng nhập để lưu lá số, số dư xu và lịch sử luận giải.",
      "Bạn chịu trách nhiệm giữ an toàn thiết bị, email đăng nhập và phiên truy cập của mình.",
      "Nếu phát hiện truy cập bất thường hoặc giao dịch không nhận ra, hãy liên hệ hỗ trợ càng sớm càng tốt.",
    ],
  },
  {
    title: "Xu và nội dung trả phí",
    paragraphs: [
      "Giá xu của từng phần luận giải được hiển thị trước khi mở khóa. Sau khi mở thành công, nội dung đã mở được lưu để bạn xem lại trên cùng tài khoản mà không bị trừ xu lần nữa.",
      "Chúng tôi có thể thay đổi giá, gói xu hoặc phạm vi tính năng trong tương lai. Thay đổi mới sẽ không làm mất nội dung bạn đã mở trước đó.",
    ],
  },
  {
    title: "Hành vi không được phép",
    bullets: [
      "Không cố tình tấn công, dò quét, spam, khai thác lỗi hoặc làm gián đoạn hệ thống.",
      "Không dùng nội dung của trang để mạo danh chuyên gia, cam kết kết quả tuyệt đối hoặc gây hiểu nhầm cho người khác.",
      "Không sao chép hàng loạt nội dung, dữ liệu hoặc giao diện khi chưa có sự đồng ý bằng văn bản.",
    ],
  },
  {
    title: "Thay đổi điều khoản",
    paragraphs: [
      "Chúng tôi có thể cập nhật điều khoản để phù hợp với tính năng mới, quy định pháp luật hoặc yêu cầu vận hành. Phiên bản mới sẽ được công bố trên trang này và có hiệu lực từ ngày cập nhật.",
    ],
  },
];

export default function TermsPage() {
  const pageLd = webPageJsonLd({
    name: "Điều khoản sử dụng",
    description: `Điều khoản sử dụng ${APP_NAME}: phạm vi nội dung tử vi tham khảo, tài khoản, xu, thanh toán và trách nhiệm khi dùng dịch vụ.`,
    url: "/dieu-khoan-su-dung",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Điều khoản sử dụng", url: "/dieu-khoan-su-dung" },
    ],
  });

  return (
    <>
      <script id="terms-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <LegalPage
        eyebrow="Điều khoản"
        title="Điều khoản sử dụng"
        description="Các điều khoản này giúp trải nghiệm luận giải minh bạch hơn, đặc biệt với tài khoản, xu và nội dung trả phí."
        updatedAt="01/06/2026"
        sections={sections}
      />
    </>
  );
}
