import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { APP_URL } from "@/lib/env";
import { getArticleBySlug, listArticles } from "@/lib/data";
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { MarkdownContent } from "@/components/markdown-content";
import { ArticlePersonalizedCta } from "@/components/article-personalized-cta";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await listArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const ogImage = article.ogImage || `/api/og?title=${encodeURIComponent(article.ogTitle || article.metaTitle || article.title)}&subtitle=${encodeURIComponent(article.ogDescription || article.metaDescription || article.excerpt)}`;
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: { canonical: absoluteUrl(article.canonicalUrl || `/kien-thuc-tu-vi/${article.slug}`) },
    robots: article.robots || "index,follow",
    openGraph: {
      title: article.ogTitle || article.metaTitle || article.title,
      description: article.ogDescription || article.metaDescription || article.excerpt,
      url: `${APP_URL}/kien-thuc-tu-vi/${article.slug}`,
      images: [ogImage],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.ogTitle || article.metaTitle || article.title,
      description: article.ogDescription || article.metaDescription || article.excerpt,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const articleLd = articleJsonLd(article);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Trang chủ", url: APP_URL },
    { name: "Kiến thức tử vi", url: "/kien-thuc-tu-vi" },
    { name: article.title, url: `/kien-thuc-tu-vi/${article.slug}` },
  ]);
  const faqLd = article.faqs?.length ? faqJsonLd(article.faqs) : null;

  return (
    <main className="section">
      <script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script id="breadcrumb-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd ? <script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}
      <article className="article-shell mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/kien-thuc-tu-vi">Kiến thức tử vi</Link>
        </nav>
        <p className="eyebrow">Kiến thức tử vi</p>
        <h1 className="text-balance text-4xl font-black leading-tight text-stone-950 sm:text-5xl">{article.title}</h1>
        <p className="mt-4 text-pretty text-lg leading-8 text-stone-700">{article.excerpt}</p>
        {article.publishedAt ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {article.category ? <Link href={`/kien-thuc-tu-vi?category=${article.category.slug}`} className="tag tag-soft">{article.category.name}</Link> : null}
            <span className="tag tag-soft">Cập nhật {new Date(article.publishedAt).toLocaleDateString("vi-VN")}</span>
          </div>
        ) : null}
        <ArticlePersonalizedCta articleTitle={article.title} categoryName={article.category?.name} />
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
        <MarkdownContent content={article.content} />
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
      </article>
    </main>
  );
}
