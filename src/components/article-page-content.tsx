import Image from "next/image";
import Link from "next/link";
import { APP_URL } from "@/lib/env";
import type { ArticleView } from "@/lib/content";
import { articlePath } from "@/lib/article-path";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { extractMarkdownHeadings, MarkdownContent } from "@/components/markdown-content";
import { ArticlePersonalizedCta } from "@/components/article-personalized-cta";

export function ArticlePageContent({
  article,
  articles,
  sectionName,
  sectionHref,
}: {
  article: ArticleView;
  articles: ArticleView[];
  sectionName: string;
  sectionHref: string;
}) {
  const tableOfContents = extractMarkdownHeadings(article.content).slice(0, 8);
  const relatedByCategory = article.category?.id
    ? articles.filter((item) => item.slug !== article.slug && item.category?.id === article.category?.id)
    : [];
  const fallbackArticles = articles.filter(
    (item) => item.slug !== article.slug && !relatedByCategory.some((related) => related.slug === item.slug),
  );
  const relatedArticles = [...relatedByCategory, ...fallbackArticles].slice(0, 3);
  const midArticleCta = <ArticlePersonalizedCta articleSlug={article.slug} articleTitle={article.title} categoryName={article.category?.name} />;
  const displayDate = article.updatedAt || article.publishedAt;
  const currentPath = articlePath(article);
  const articleLd = articleJsonLd(article);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Trang chủ", url: APP_URL },
    { name: sectionName, url: sectionHref },
    { name: article.title, url: currentPath },
  ]);
  const faqLd = article.faqs?.length ? faqJsonLd(article.faqs) : null;

  return (
    <main className="section">
      <script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script id="breadcrumb-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd ? <script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}
      <article className="article-shell article-shell-public mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href={sectionHref}>{sectionName}</Link>
        </nav>
        <p className="eyebrow">{sectionName}</p>
        <h1 className="text-balance text-4xl font-black leading-tight text-stone-950 sm:text-5xl">{article.title}</h1>
        <p className="mt-4 text-pretty text-lg leading-8 text-stone-700">{article.excerpt}</p>
        {displayDate ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {article.category ? <Link href={`/kien-thuc-tu-vi?category=${article.category.slug}`} className="tag tag-soft">{article.category.name}</Link> : null}
            <span className="tag tag-soft">Cập nhật {new Date(displayDate).toLocaleDateString("vi-VN")}</span>
          </div>
        ) : null}
        {tableOfContents.length ? (
          <nav className="article-table-of-contents" aria-label="Trong bài này">
            <p>Trong bài này</p>
            <ol>
              {tableOfContents.map((heading) => (
                <li key={heading.id}>
                  <a href={`#${heading.id}`}>{heading.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {article.coverImage ? (
          <figure className="article-cover">
            <Image
              src={article.coverImage}
              alt={article.coverAlt || article.title}
              width={1200}
              height={675}
              priority
              sizes="(min-width: 768px) 768px, 100vw"
            />
            {article.coverAlt ? <figcaption>{article.coverAlt}</figcaption> : null}
          </figure>
        ) : null}
        <MarkdownContent content={article.content} afterFirstSection={midArticleCta} />
        {article.faqs?.length ? (
          <section className="article-faq" aria-labelledby="article-faq-heading">
            <h2 id="article-faq-heading">Câu hỏi thường gặp</h2>
            <div className="article-faq-list">
              {article.faqs.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
        <div className="article-final-cta">
          <ArticlePersonalizedCta articleSlug={article.slug} articleTitle={article.title} categoryName={article.category?.name} variant="final" />
        </div>
        {relatedArticles.length ? (
          <section className="article-related-section" aria-labelledby="article-related-heading">
            <p className="eyebrow">Đọc tiếp</p>
            <h2 id="article-related-heading">Bài liên quan cùng chủ đề</h2>
            <div className="article-related-grid">
              {relatedArticles.map((related) => (
                <Link key={related.slug} href={articlePath(related)} className={`article-related-card${related.coverImage ? "" : " no-thumb"}`}>
                  {related.coverImage ? (
                    <span className="article-related-thumb">
                      <Image src={related.coverImage} alt={related.coverAlt || related.title} width={320} height={180} sizes="(min-width: 768px) 220px, 30vw" />
                    </span>
                  ) : null}
                  <span>
                    {related.category ? <em>{related.category.name}</em> : null}
                    <strong>{related.title}</strong>
                    <small>{related.excerpt}</small>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
