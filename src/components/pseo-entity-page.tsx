import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PseoEntityPageView } from "@/lib/pseo-data";
import { getPseoEntityContent } from "@/lib/pseo-entity-content";

export function PseoEntityPage({ page }: { page: PseoEntityPageView }) {
  const isStar = page.kind === "MAIN_STAR";
  const content = getPseoEntityContent(page.kind, page.entity);
  const subject = isStar ? `sao ${page.entity.name}` : `cung ${page.entity.name}`;

  return (
    <main className="pseo-hub pseo-entity-page section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/tra-cuu">Tra cứu</Link>
          <span>/</span>
          <Link href={page.hubHref}>{page.hubLabel}</Link>
          <span>/</span>
          <span>{page.title}</span>
        </nav>

        <header>
          <p className="eyebrow">{page.hubLabel}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>

        <section className="pseo-entity-summary">
          <div>
            <span>Ngũ hành / Chủ đề</span>
            <strong>{page.entity.element}</strong>
          </div>
          <div>
            <span>Ý nghĩa nền</span>
            <strong>{page.entity.summary}</strong>
          </div>
          <div>
            <span>Mục đích tra cứu</span>
            <strong>{content.intent}</strong>
          </div>
        </section>

        <section className="pseo-entity-content">
          <article>
            <p className="pseo-entity-reading-note">
              Đây là lớp tra cứu nền. Muốn luận đúng, hãy đặt {subject} vào toàn bộ lá số, bộ sao đi kèm, trạng thái mạnh yếu,
              tam hợp/xung chiếu, vận đang tác động và câu hỏi thực tế của người xem.
            </p>

            <h2>{isStar ? `Cách đọc sao ${page.entity.name}` : `Cách đọc cung ${page.entity.name}`}</h2>
            {content.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h2>Ba lớp cần đối chiếu trước khi kết luận</h2>
            <div className="prose-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Lớp đọc</th>
                    <th scope="col">Nội dung</th>
                    <th scope="col">Cách dùng an toàn</th>
                  </tr>
                </thead>
                <tbody>
                  {content.contextRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                      <td>{row.howToRead}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>Khi nào {subject} phát huy rõ?</h2>
            <div className="pseo-entity-detail-grid">
              {content.usefulSignals.map((item) => (
                <section key={item.body}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </section>
              ))}
            </div>

            <h2>Các lỗi đọc sai thường gặp</h2>
            <div className="pseo-entity-detail-grid">
              {content.misreadRisks.map((item) => (
                <section key={item.body}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </section>
              ))}
            </div>

            <h2>Cách tự kiểm chứng trên lá số cá nhân</h2>
            <ol>
              {content.practiceSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <h2>Những yếu tố có thể làm đổi nghĩa</h2>
            {content.modifierNotes.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h2>Câu hỏi thường gặp</h2>
            <div className="pseo-entity-faq">
              {content.faqs.map((item) => (
                <section key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </section>
              ))}
            </div>
          </article>

          <aside className="pseo-vip-sidebar">
            <Sparkles aria-hidden="true" size={28} />
            <h2>Luận giải VIP theo lá số riêng</h2>
            <p>Trang tra cứu chỉ là lớp nghĩa nền. Hồ sơ VIP sẽ ghép ngày giờ sinh, cung sao và vận hạn để đọc sát trường hợp của bạn hơn.</p>
            <Link href="/pricing" className="pseo-vip-link">
              Xem luận giải VIP
            </Link>
          </aside>
        </section>

        {page.relatedPages.length > 0 ? (
          <section className="pseo-related">
            <div className="pseo-related-group">
              <h2>{isStar ? `12 tổ hợp của sao ${page.entity.name}` : `14 chính tinh tại cung ${page.entity.name}`}</h2>
              <div>
                {page.relatedPages.map((item) => (
                  <Link key={item.slug} href={`/tra-cuu/${item.slug}`}>
                    <span>{item.title}</span>
                    <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
