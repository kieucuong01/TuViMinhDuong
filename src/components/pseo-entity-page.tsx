import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PseoEntityPageView } from "@/lib/pseo-data";

export function PseoEntityPage({ page }: { page: PseoEntityPageView }) {
  const isStar = page.kind === "MAIN_STAR";
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
        </section>

        <section className="pseo-entity-content">
          <article>
            <p className="pseo-entity-reading-note">
              Đây là lớp tra cứu nền. Muốn luận đúng, hãy đặt {isStar ? `sao ${page.entity.name}` : `cung ${page.entity.name}`} vào
              toàn bộ lá số, bộ sao đi kèm, trạng thái mạnh yếu và câu hỏi thực tế của người xem.
            </p>
            <h2>{isStar ? `Cách đọc sao ${page.entity.name}` : `Cách đọc cung ${page.entity.name}`}</h2>
            <p>
              {isStar
                ? `Sao ${page.entity.name} cho biết một kiểu năng lượng nền trong lá số. Khi đọc riêng, chỉ nên xem đây là lớp khái quát; muốn luận đúng cần đặt sao vào cung, bộ sao đi kèm và vận đang tác động.`
                : `Cung ${page.entity.name} là một khu vực đời sống trong lá số. Cung cho biết chủ đề cần quan sát, còn chính tinh và phụ tinh cho biết cách chủ đề đó biểu hiện trong từng trường hợp cụ thể.`}
            </p>
            <h2>Điểm mạnh nên quan sát</h2>
            <ul>
              {page.entity.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2>Điểm cần thận trọng</h2>
            <ul>
              {page.entity.cautions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <aside>
            <Sparkles aria-hidden="true" size={28} />
            <h2>Muốn đối chiếu với lá số riêng?</h2>
            <p>Lập lá số miễn phí để xem sao, cung và vận hạn đang nằm ở vị trí nào trong trường hợp của bạn.</p>
            <Link href="/#lap-la-so" className="btn btn-primary">
              Lập lá số miễn phí
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
