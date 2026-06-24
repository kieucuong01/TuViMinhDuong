import Image from "next/image";
import Link from "next/link";
import { BookOpenText, CalendarDays, LogIn, Sparkles } from "lucide-react";
import { FooterAccountPolicyLink } from "@/components/footer-account-policy-link";
import { APP_NAME } from "@/lib/env";

const primaryLinks = [
  { href: "/#lap-la-so", label: "Lập lá số tử vi miễn phí", description: "Tạo lá số 12 cung và xem phần cơ bản ngay.", icon: Sparkles },
  { href: "/xem-ngay", label: "Xem ngày tốt xấu", description: "Tra ngày phù hợp cho việc quan trọng.", icon: CalendarDays },
  { href: "/kien-thuc-tu-vi", label: "Kiến thức tử vi", description: "Bài viết nền tảng, dễ đọc cho người mới.", icon: BookOpenText },
  { href: "/dang-nhap", label: "Đăng nhập", description: "Lưu lá số, xem lại lịch sử và luận giải đã mở.", icon: LogIn },
];

const knowledgeLinks = [
  { href: "/kien-thuc-tu-vi/la-so-tu-vi-la-gi", label: "Lá số tử vi là gì?" },
  { href: "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi", label: "Cách đọc lá số tử vi" },
  { href: "/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi", label: "12 cung trong lá số tử vi" },
  { href: "/kien-thuc-tu-vi/dai-van-la-gi", label: "Đại vận là gì?" },
  { href: "/kien-thuc-tu-vi/nguyet-van-nhat-van", label: "Nguyệt vận và Nhật vận" },
  { href: "/kien-thuc-tu-vi/xem-ngay-tot-xau-theo-tuoi", label: "Xem ngày tốt xấu theo tuổi" },
];

const trustLinks = [
  { href: "/dang-nhap?next=/la-so", label: "Đăng nhập để xem lá số đã lưu" },
  { href: "/kien-thuc-tu-vi", label: "Kiến thức tử vi" },
];

const legalLinks = [
  { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
  { href: "/dieu-khoan-su-dung", label: "Điều khoản sử dụng" },
  { href: "/lien-he", label: "Liên hệ hỗ trợ" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Chân trang Lá số tinh hoa">
      <div className="site-footer-shell mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="site-footer-brand">
          <Link href="/#lap-la-so" className="site-footer-logo" prefetch={false} aria-label={`${APP_NAME} - lập lá số tử vi miễn phí`}>
            <span className="site-footer-logo-mark" aria-hidden="true">
              <Image src="/brand/laso-tinhhoa-mark.svg" alt="" width={44} height={44} sizes="44px" />
            </span>
            <span>
              <strong>{APP_NAME}</strong>
              <em>lasotinhhoa.vn</em>
            </span>
          </Link>
          <p>
            {APP_NAME} giúp bạn lập lá số tử vi miễn phí, xem ngày tốt xấu và đọc kiến thức tử vi bằng ngôn ngữ rõ ràng, dễ áp dụng.
          </p>
          <div className="site-footer-trust" aria-label="Thông tin tham khảo">
            <span>Ngôn ngữ Việt Nam</span>
            <span>Nội dung tham khảo</span>
            <span>Ưu tiên đọc dễ trên điện thoại</span>
          </div>
        </div>

        <nav className="site-footer-primary" aria-label="Công cụ tử vi chính">
          {primaryLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} className="site-footer-primary-link" prefetch={false}>
                <span aria-hidden="true"><Icon size={19} strokeWidth={2.3} /></span>
                <strong>{item.label}</strong>
                <em>{item.description}</em>
              </Link>
            );
          })}
        </nav>

        <div className="site-footer-columns">
          <nav aria-label="Cụm kiến thức tử vi nền tảng">
            <h2>Học tử vi căn bản</h2>
            <ul>
              {knowledgeLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} prefetch={false}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Tài khoản và luận giải">
            <h2>Tài khoản và luận giải</h2>
            <ul>
              {trustLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} prefetch={false}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Chính sách và hỗ trợ">
            <h2>Chính sách và hỗ trợ</h2>
            <ul>
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} prefetch={false}>{item.label}</Link>
                </li>
              ))}
              <FooterAccountPolicyLink />
            </ul>
          </nav>

          <section aria-labelledby="site-footer-note-title">
            <h2 id="site-footer-note-title">Cách dùng phù hợp</h2>
            <p>
              Hãy xem lá số như một bản đồ tham khảo để tự soi lại công việc, tài chính, gia đình và nhịp sống. Nội dung không thay thế tư vấn y tế, pháp lý hoặc tài chính chuyên môn.
            </p>
          </section>
        </div>

        <div className="site-footer-bottom">
          <p>© {year} {APP_NAME}. Giữ trải nghiệm tử vi rõ ràng, bình tĩnh và dễ đọc.</p>
          <Link href="/kien-thuc-tu-vi" prefetch={false}>Xem toàn bộ bài viết tử vi</Link>
        </div>
      </div>
    </footer>
  );
}
