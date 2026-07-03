import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PseoSupportStarPage, getPseoSupportStarFaqs } from "@/components/pseo-support-star-page";
import { SUPPORT_STARS } from "@/lib/pseo-registry";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

function getSupportStar(slug: string) {
  return SUPPORT_STARS.find((item) => item.slug === slug);
}

export function generateStaticParams() {
  return SUPPORT_STARS.map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entity = getSupportStar(slug);
  if (!entity) return {};

  const canonicalUrl = entity.canonicalPath || `/tra-cuu/phu-tinh/${entity.slug}`;
  const title = `Sao ${entity.name} trong tử vi: ý nghĩa phụ tinh`;
  const description = `Tra cứu ý nghĩa sao ${entity.name}, vai trò phụ tinh, điểm nên phát huy, điều cần thận trọng và cách đọc cùng chính tinh, cung, vận hạn.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalUrl) },
    robots: "index,follow",
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalUrl),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SupportStarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = getSupportStar(slug);
  if (!entity) notFound();

  const canonicalUrl = entity.canonicalPath || `/tra-cuu/phu-tinh/${entity.slug}`;
  const title = `Sao ${entity.name} trong tử vi`;
  const description = `Tra cứu vai trò của ${entity.name}, cách đọc phụ tinh này cùng cung, chính tinh và vận hạn.`;
  const breadcrumb = [
    { name: "Trang chủ", url: "/" },
    { name: "Tra cứu", url: "/tra-cuu" },
    { name: "Phụ Tinh", url: "/tra-cuu/phu-tinh" },
    { name: title, url: canonicalUrl },
  ];
  const pageLd = webPageJsonLd({
    name: title,
    description,
    url: canonicalUrl,
    breadcrumb,
  });
  const breadcrumbLd = breadcrumbJsonLd(breadcrumb);
  const faqLd = faqJsonLd(getPseoSupportStarFaqs());

  return (
    <>
      <script id="pseo-support-star-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="pseo-support-star-breadcrumb-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="pseo-support-star-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PseoSupportStarPage entity={entity} />
    </>
  );
}
