import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { APP_URL } from "@/lib/env";
import { getArticleBySlug, listArticles } from "@/lib/data";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { MarkdownContent } from "@/components/markdown-content";

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
  const ogImage = article.ogImage || article.coverImage || `/api/og?title=${encodeURIComponent(article.ogTitle || article.metaTitle || article.title)}&subtitle=${encodeURIComponent(article.ogDescription || article.metaDescription || article.excerpt)}`;
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: { canonical: article.canonicalUrl || `/kien-thuc-tu-vi/${article.slug}` },
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
    { name: "Kiến thức tử vi", url: `${APP_URL}/kien-thuc-tu-vi` },
    { name: article.title, url: `${APP_URL}/kien-thuc-tu-vi/${article.slug}` },
  ]);

  return (
    <main className="section">
      <script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script id="breadcrumb-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <article className="article-shell mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/kien-thuc-tu-vi">Kiến thức tử vi</Link>
        </nav>
        <p className="eyebrow">Kiến thức tử vi</p>
        <h1 className="text-balance text-4xl font-black leading-tight text-stone-950 sm:text-5xl">{article.title}</h1>
        <p className="mt-4 text-pretty text-lg leading-8 text-stone-700">{article.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="seo-pill">SEO {article.seoScore || 0}/100</span>
          {article.focusKeyword ? <span className="tag">Từ khóa: {article.focusKeyword}</span> : null}
          {article.publishedAt ? <span className="tag tag-soft">Cập nhật {new Date(article.publishedAt).toLocaleDateString("vi-VN")}</span> : null}
        </div>
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
      </article>
    </main>
  );
}
