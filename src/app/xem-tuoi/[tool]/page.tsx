import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { AgeTool } from "@/components/age-tool";
import { AGE_TOOL_PAGES, getAgeToolPage } from "@/lib/age-tools";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, webApplicationJsonLd, webPageJsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return AGE_TOOL_PAGES.map((page) => ({ tool: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool } = await params;
  const page = getAgeToolPage(tool);
  if (!page) return {};

  return routeMetadata({
    title: page.title,
    description: page.description,
    path: `/xem-tuoi/${page.slug}`,
    imageSubtitle: page.shortDescription,
  });
}

export default async function AgeToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const page = getAgeToolPage(tool);
  if (!page) notFound();

  const canonicalPath = `/xem-tuoi/${page.slug}`;
  const pageLd = webPageJsonLd({
    name: page.title,
    description: page.description,
    url: canonicalPath,
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Xem tuổi", url: "/xem-tuoi" },
      { name: page.label, url: canonicalPath },
    ],
  });
  const appLd = webApplicationJsonLd({ name: page.title, description: page.description, url: canonicalPath });
  const faqLd = faqJsonLd(page.faqs);

  return (
    <main className="age-page age-tool-shell">
      <script id="age-tool-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="age-tool-app-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script id="age-tool-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="age-page-container">
        <nav className="age-breadcrumb" aria-label="Đường dẫn trang">
          <Link href="/">Trang chủ</Link><ChevronRight aria-hidden="true" size={15} />
          <Link href="/xem-tuoi">Xem tuổi</Link><ChevronRight aria-hidden="true" size={15} />
          <span aria-current="page">{page.label}</span>
        </nav>

        <header className="age-tool-hero">
          <div>
            <h1>{page.heading}</h1>
            <p>{page.intro}</p>
          </div>
          <aside><strong>Không chấm điểm tùy ý</strong><p>Mỗi trạng thái đều kèm quy tắc và lời giải thích để bạn tự kiểm tra.</p></aside>
        </header>

        <AgeTool tool={page.slug} />

        <section className="age-tool-editorial">
          <div className="age-tool-guide-grid">
            <article>
              <span>Phương pháp</span>
              <h2>Công cụ đang tính những gì?</h2>
              <ol>{page.method.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol>
            </article>
            <article>
              <span>Cách đọc</span>
              <h2>Dùng kết quả có trách nhiệm</h2>
              <ul>{page.readingTips.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>

          <article className="age-tool-example">
            <span>Ví dụ đọc kết quả</span>
            <h2>Không bỏ qua tín hiệu trái chiều</h2>
            <p>{page.example}</p>
          </article>

          <section className="age-tool-faq" aria-labelledby="age-tool-faq-title">
            <div className="age-section-head"><span>Giải đáp ngắn</span><h2 id="age-tool-faq-title">Câu hỏi thường gặp</h2></div>
            <div>{page.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
          </section>

          <section className="age-tool-related" aria-labelledby="age-related-title">
            <div><span>Cùng chủ đề</span><h2 id="age-related-title">Công cụ liên quan</h2></div>
            <div>
              {page.related.map((slug) => {
                const related = getAgeToolPage(slug);
                return related ? <Link key={slug} href={`/xem-tuoi/${slug}`}><span><strong>{related.label}</strong><small>{related.shortDescription}</small></span><ArrowRight aria-hidden="true" size={18} /></Link> : null;
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
