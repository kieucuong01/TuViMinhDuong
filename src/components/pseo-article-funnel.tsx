import Link from "next/link";
import { ArrowRight, BookOpenText, Sparkles } from "lucide-react";
import { ChartForm } from "@/components/chart-form";
import { MarkdownContent } from "@/components/markdown-content";
import type { PseoPageDraft } from "@/lib/pseo-registry";

type PseoArticleFunnelProps = {
  page: PseoPageDraft;
  sameStar: PseoPageDraft[];
  samePalace: PseoPageDraft[];
};

function RelatedList({ title, pages }: { title: string; pages: PseoPageDraft[] }) {
  if (pages.length === 0) return null;

  return (
    <section className="pseo-related-group">
      <h2>{title}</h2>
      <div>
        {pages.map((page) => (
          <Link key={page.slug} href={`/tra-cuu/${page.slug}`}>
            <span>{page.title}</span>
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PseoArticleFunnel({ page, sameStar, samePalace }: PseoArticleFunnelProps) {
  const year = new Date().getFullYear();
  const hasRelatedPages = sameStar.length > 0 || samePalace.length > 0;
  const inlineForm = (
    <section id="lap-la-so-ca-nhan" className="pseo-inline-form" aria-labelledby="pseo-form-heading">
      <div className="pseo-inline-form-copy">
        <p>Đối chiếu theo ngày giờ sinh</p>
        <h2 id="pseo-form-heading">Xem {page.title.toLowerCase()} ảnh hưởng thế nào đến riêng bạn</h2>
        <span>Nhập thông tin sinh để lập lá số và xem bản luận giải chi tiết năm {year}.</span>
      </div>
      <ChartForm compact adSource="pseo_inline" />
    </section>
  );

  return (
    <>
      <div className="pseo-sticky-banner">
        <span>Bạn muốn biết nội dung này ảnh hưởng thế nào đến vận mệnh của riêng mình?</span>
        <a href="#lap-la-so-ca-nhan">Lập lá số miễn phí ngay</a>
      </div>
      <article className="pseo-article-shell">
        <main>
          <nav className="article-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span>/</span>
            <Link href="/tra-cuu">Tra cứu</Link>
            <span>/</span>
            <span>{page.title}</span>
          </nav>
          <header className="pseo-hero">
            <h1>{page.title}</h1>
            <p>{page.excerpt}</p>
          </header>
          <dl className="pseo-data-strip">
            <div>
              <dt>Điểm tốt</dt>
              <dd>{page.goodPoints.join("; ")}</dd>
            </div>
            <div>
              <dt>Cần lưu ý</dt>
              <dd>{page.cautionPoints.join("; ")}</dd>
            </div>
            <div>
              <dt>Ngũ hành</dt>
              <dd>{page.element}</dd>
            </div>
            <div>
              <dt>Tiềm năng</dt>
              <dd>{page.scores.potential}/10</dd>
            </div>
          </dl>
          <MarkdownContent content={page.body} afterFirstSection={inlineForm} />
          <div className="pseo-mobile-vip">
            <Link href="/pricing" className="btn btn-primary">
              Xem luận giải VIP
            </Link>
          </div>
          {hasRelatedPages ? (
            <section className="pseo-related">
              <RelatedList title="Cùng sao, khác cung" pages={sameStar} />
              <RelatedList title="Cùng cung, khác sao" pages={samePalace} />
            </section>
          ) : null}
        </main>
        <aside className="pseo-vip-sidebar">
          <Sparkles aria-hidden="true" size={28} />
          <h2>Luận giải VIP theo lá số riêng</h2>
          <p>Đọc sâu công việc, tài chính, tình cảm và vận năm dựa trên toàn bộ lá số của bạn.</p>
          <a href="#lap-la-so-ca-nhan" className="btn btn-primary">
            Lập lá số trước
          </a>
          <Link href="/pricing" className="pseo-vip-link">
            Xem các gói luận giải
          </Link>
          <span>
            <BookOpenText size={16} />
            Nội dung tham khảo, không thay thế tư vấn chuyên môn.
          </span>
        </aside>
      </article>
    </>
  );
}
