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

const palaceLinks = [
  { href: "/tra-cuu/y-nghia-12-cung", label: "Tra cứu đầy đủ 12 cung" },
  { href: "/tra-cuu/cung-menh", label: "Cung Mệnh" },
  { href: "/tra-cuu/cung-tai-bach", label: "Cung Tài Bạch" },
  { href: "/tra-cuu/cung-quan-loc", label: "Cung Quan Lộc" },
  { href: "/tra-cuu/cung-phu-the", label: "Cung Phu Thê" },
  { href: "/tra-cuu/cung-phuc-duc", label: "Cung Phúc Đức" },
];

const starLinks = [
  { href: "/tra-cuu/y-nghia-14-chinh-tinh", label: "Tra cứu đầy đủ 14 Chính Tinh" },
  { href: "/tra-cuu/sao-tu-vi", label: "Sao Tử Vi" },
  { href: "/tra-cuu/sao-thien-co", label: "Sao Thiên Cơ" },
  { href: "/tra-cuu/sao-thai-am", label: "Sao Thái Âm" },
  { href: "/tra-cuu/sao-that-sat", label: "Sao Thất Sát" },
  { href: "/tra-cuu/phu-tinh", label: "Tra cứu Phụ Tinh" },
];

const fortuneLinks = [
  { href: "/kien-thuc-tu-vi/dai-van-la-gi", label: "Đại vận là gì?" },
  { href: "/kien-thuc-tu-vi/tieu-van-la-gi", label: "Tiểu vận là gì?" },
  { href: "/kien-thuc-tu-vi/nguyet-van-nhat-van", label: "Nguyệt vận và Nhật vận" },
  { href: "/kien-thuc-tu-vi/tuan-triet-trong-la-so-tu-vi", label: "Tuần Triệt trong lá số" },
  { href: "/xem-ngay", label: "Xem ngày tốt xấu theo tuổi" },
];

const utilityLinks = [
  { href: "/#lap-la-so", label: "Lập lá số tử vi miễn phí" },
  { href: "/tra-cuu", label: "Tra cứu sao và cung" },
  { href: "/kien-thuc-tu-vi/la-so-tu-vi-la-gi", label: "Lá số tử vi là gì?" },
  { href: "/kien-thuc-tu-vi/cach-doc-la-so-tu-vi-cho-nguoi-moi", label: "Cách đọc lá số tử vi" },
  { href: "/pricing", label: "Luận giải VIP" },
  { href: "/dang-nhap?next=/la-so", label: "Đăng nhập để xem lá số đã lưu" },
];

const legalLinks = [
  { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
  { href: "/dieu-khoan-su-dung", label: "Điều khoản sử dụng" },
  { href: "/lien-he", label: "Liên hệ hỗ trợ" },
];

const silos = [
  { heading: "Ý nghĩa các Cung", links: palaceLinks },
  { heading: "Ý nghĩa Chính Tinh", links: starLinks },
  { heading: "Vận Hạn & Lưu Niên", links: fortuneLinks },
  { heading: "Tiện ích", links: utilityLinks },
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
            <span><strong>{APP_NAME}</strong><em>lasotinhhoa.vn</em></span>
          </Link>
          <p>{APP_NAME} giúp bạn lập lá số tử vi miễn phí, xem ngày tốt xấu và tra cứu sao, cung bằng ngôn ngữ rõ ràng, dễ áp dụng.</p>
          <div className="site-footer-trust" aria-label="Thông tin tham khảo">
            <span>Ngôn ngữ Việt Nam</span><span>Nội dung tham khảo</span><span>Ưu tiên đọc dễ trên điện thoại</span>
          </div>
        </div>

        <nav className="site-footer-primary" aria-label="Công cụ tử vi chính">
          {primaryLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="site-footer-primary-link" prefetch={false}>
                <span aria-hidden="true"><Icon size={19} strokeWidth={2.3} /></span>
                <strong>{item.label}</strong><em>{item.description}</em>
              </Link>
            );
          })}
        </nav>

        <div className="site-footer-columns">
          {silos.map((silo) => (
            <nav key={silo.heading} aria-label={silo.heading}>
              <h2>{silo.heading}</h2>
              <ul>
                {silo.links.map((item) => (
                  <li key={item.href}><Link href={item.href} prefetch={false}>{item.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="site-footer-bottom">
          <p>© {year} {APP_NAME}. Giữ trải nghiệm tử vi rõ ràng, bình tĩnh và dễ đọc.</p>
          <div className="site-footer-legal">
            {legalLinks.map((item) => <Link key={item.href} href={item.href} prefetch={false}>{item.label}</Link>)}
            <FooterAccountPolicyLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
