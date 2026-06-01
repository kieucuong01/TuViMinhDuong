import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { APP_NAME } from "@/lib/env";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
  contactHref?: string;
};

export function LegalPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
  contactHref = "/lien-he",
}: LegalPageProps) {
  return (
    <main>
      <section className="section">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="btn btn-ghost mb-6 w-fit" prefetch={false}>
            <ArrowLeft size={18} /> Về trang chủ
          </Link>

          <div className="section-heading text-left">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">{description}</p>
            <p className="mt-3 text-sm font-bold uppercase tracking-wide text-stone-500">Cập nhật: {updatedAt}</p>
          </div>

          <article className="panel prose-content max-w-none">
            {sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`legal-section-${index}`}>
                <h2 id={`legal-section-${index}`}>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>

          <aside className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-5 text-stone-700">
            <p className="font-bold text-stone-950">Cần hỗ trợ thêm?</p>
            <p className="mt-2 leading-7">
              Vui lòng gửi thông tin qua trang liên hệ của {APP_NAME}. Với giao dịch thanh toán, hãy kèm email đăng nhập
              và mã đơn hàng để đội ngũ kiểm tra nhanh hơn.
            </p>
            <Link href={contactHref} className="btn btn-secondary mt-4 w-fit" prefetch={false}>
              <Mail size={18} /> Liên hệ hỗ trợ
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
