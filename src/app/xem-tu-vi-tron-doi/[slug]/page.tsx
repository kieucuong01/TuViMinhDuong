import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { APP_URL } from "@/lib/env";
import { getArticleBySlug, listArticleIndex } from "@/lib/data";
import { isLifetimeTuViSlug, lifetimeTuViArticlePath } from "@/lib/article-path";
import { absoluteUrl } from "@/lib/seo";
import { ArticlePageContent } from "@/components/article-page-content";
import { normalizeArticleMetadataTitle } from "@/lib/article-metadata";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await listArticleIndex();
  return articles.filter((article) => isLifetimeTuViSlug(article.slug)).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isLifetimeTuViSlug(slug)) return {};
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const canonicalPath = lifetimeTuViArticlePath(article.slug);
  const ogImage = article.ogImage || `/api/og?title=${encodeURIComponent(article.ogTitle || article.metaTitle || article.title)}&subtitle=${encodeURIComponent(article.ogDescription || article.metaDescription || article.excerpt)}`;
  return {
    title: normalizeArticleMetadataTitle(article.metaTitle || article.title),
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
  const [article, articles] = await Promise.all([getArticleBySlug(slug), listArticleIndex()]);
  if (!article) notFound();
  const canonicalPath = lifetimeTuViArticlePath(article.slug);
  if (canonicalPath !== `/xem-tu-vi-tron-doi/${slug}`) redirect(canonicalPath);

  return <ArticlePageContent article={article} articles={articles} sectionName="Tử vi trọn đời" sectionHref="/xem-tu-vi-tron-doi" />;
}
