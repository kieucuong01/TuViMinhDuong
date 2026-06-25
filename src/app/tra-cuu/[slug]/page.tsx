import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PseoArticleFunnel } from "@/components/pseo-article-funnel";
import { getPublishedPseoPage, getRelatedPseoPages, listPublishedPseoSlugs } from "@/lib/pseo-data";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listPublishedPseoSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPseoPage(slug);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: absoluteUrl(page.canonicalUrl) },
    robots: page.robots,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: absoluteUrl(page.canonicalUrl),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

export default async function PseoLeafPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPseoPage(slug);
  if (!page) notFound();
  const related = await getRelatedPseoPages(page.starSlug, page.palaceSlug);
  const breadcrumb = [
    { name: "Trang chủ", url: "/" },
    { name: "Tra cứu", url: "/tra-cuu" },
    { name: page.title, url: page.canonicalUrl },
  ];
  const pageLd = webPageJsonLd({
    name: page.title,
    description: page.excerpt,
    url: page.canonicalUrl,
    breadcrumb,
  });
  const breadcrumbLd = breadcrumbJsonLd(breadcrumb);
  const faqLd = faqJsonLd(page.faqs);

  return (
    <main className="pseo-page">
      <script id="pseo-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="pseo-breadcrumb-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="pseo-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PseoArticleFunnel page={page} sameStar={related.sameStar} samePalace={related.samePalace} />
    </main>
  );
}
