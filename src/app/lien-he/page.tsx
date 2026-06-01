import Link from "next/link";
import { Mail, ReceiptText, ShieldQuestion, Sparkles } from "lucide-react";

import { APP_NAME, ADMIN_EMAIL } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Liên hệ hỗ trợ",
  description: `Liên hệ ${APP_NAME} để được hỗ trợ tài khoản, lá số, nạp xu, giao dịch PayOS/VietQR và hoàn xu khi có lỗi kỹ thuật.`,
  path: "/lien-he",
});

const supportItems = [
  {
    title: "Thanh toán và xu",
    description: "Kiểm tra đơn PayOS/VietQR, số dư xu, giao dịch đã trả tiền nhưng chưa được cộng xu.",
    icon: ReceiptText,
  },
  {
    title: "Tài khoản và lá số",
    description: "Hỗ trợ đăng nhập, xem lại lá số đã lưu, nội dung luận giải đã mở trên tài khoản.",
    icon: Sparkles,
  },
  {
    title: "Chính sách và dữ liệu",
    description: "Yêu cầu kiểm tra dữ liệu cá nhân, chính sách bảo mật, điều khoản hoặc hoàn xu.",
    icon: ShieldQuestion,
  },
];

export default function ContactPage() {
  return (
    <main>
      <section className="section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading">
            <p className="eyebrow">Hỗ trợ</p>
            <h1>Liên hệ {APP_NAME}</h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              Gửi thông tin rõ ràng để đội ngũ kiểm tra nhanh các vấn đề về tài khoản, lá số, nạp xu và nội dung đã mở.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {supportItems.map((item) => {
              const Icon = item.icon;

              return (
                <section key={item.title} className="feature-card">
                  <Icon className="text-orange-700" size={25} />
                  <h2 className="mt-3 text-xl font-black text-stone-950">{item.title}</h2>
                  <p>{item.description}</p>
                </section>
              );
            })}
          </div>

          <section className="panel mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="eyebrow">Email hỗ trợ</p>
              <h2 className="text-3xl font-black tracking-tight text-stone-950">Gửi yêu cầu qua email</h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                Với giao dịch thanh toán, vui lòng kèm email đăng nhập, mã đơn hàng, số tiền, thời gian thanh toán và ảnh
                chụp biên lai nếu có.
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-stone-500">Địa chỉ email</p>
              <a className="mt-2 flex items-center gap-2 break-all text-xl font-black text-orange-800" href={`mailto:${ADMIN_EMAIL}`}>
                <Mail size={21} /> {ADMIN_EMAIL}
              </a>
              <p className="mt-4 text-sm leading-6 text-stone-600">
                Thời gian phản hồi thường trong 1-2 ngày làm việc. Hiện website chưa vận hành tổng đài điện thoại.
              </p>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/chinh-sach-thanh-toan-hoan-xu" className="btn btn-secondary" prefetch={false}>
              Chính sách hoàn xu
            </Link>
            <Link href="/chinh-sach-bao-mat" className="btn btn-ghost" prefetch={false}>
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
