import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { APP_URL } from "@/lib/env";
import { getArticleBySlug, listArticles } from "@/lib/data";
import { articlePath, isLifetimeTuViSlug } from "@/lib/article-path";
import { absoluteUrl } from "@/lib/seo";
import { ArticlePageContent } from "@/components/article-page-content";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await listArticles();
  return articles.filter((article) => isLifetimeTuViSlug(article.slug)).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isLifetimeTuViSlug(slug)) return {};
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const canonicalPath = articlePath(article);
  const ogImage = article.ogImage || `/api/og?title=${encodeURIComponent(article.ogTitle || article.metaTitle || article.title)}&subtitle=${encodeURIComponent(article.ogDescription || article.metaDescription || article.excerpt)}`;
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    robots: article.robots || "index,follow",
    openGraph: {
      title: article.ogTitle || article.metaTitle || article.title,
      description: article.ogDescription || article.metaDescription || article.excerpt,
      url: `${APP_URL}${canonicalPath}`,
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

export default async function LifetimeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLifetimeTuViSlug(slug)) notFound();
  const [article, articles] = await Promise.all([getArticleBySlug(slug), listArticles()]);
  if (!article) notFound();
  const canonicalPath = articlePath(article);
  if (canonicalPath !== `/${slug}`) redirect(canonicalPath);

  return <ArticlePageContent article={article} articles={articles} sectionName="Tử vi trọn đời" sectionHref="/xem-tu-vi-tron-doi" />;
}
