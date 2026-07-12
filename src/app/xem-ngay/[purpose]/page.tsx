import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateView } from "@/components/date-view";
import { DATE_PURPOSE_PAGES, getDatePurposePage } from "@/lib/date-purpose-pages";
import { routeMetadata } from "@/lib/metadata";
import { faqJsonLd, webApplicationJsonLd, webPageJsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return DATE_PURPOSE_PAGES.map((page) => ({ purpose: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ purpose: string }> }): Promise<Metadata> {
  const { purpose } = await params;
  const page = getDatePurposePage(purpose);
  if (!page) return {};

  return routeMetadata({
    title: page.title,
    description: page.description,
    path: `/xem-ngay/${page.slug}` as `/${string}`,
    imageSubtitle: page.description,
  });
}

export default async function DatePurposePage({
  params,
  searchParams,
}: {
  params: Promise<{ purpose: string }>;
  searchParams: Promise<{ from?: string | string[]; to?: string | string[]; birthYear?: string | string[] }>;
}) {
  const [{ purpose }, query] = await Promise.all([params, searchParams]);
  const page = getDatePurposePage(purpose);
  if (!page) notFound();

  const pageLd = webPageJsonLd({
    name: page.title,
    description: page.description,
    url: `/xem-ngay/${page.slug}`,
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Xem ngày tốt xấu", url: "/xem-ngay" },
      { name: page.title, url: `/xem-ngay/${page.slug}` },
    ],
  });
  const appLd = webApplicationJsonLd({
    name: page.title,
    description: page.description,
    url: `/xem-ngay/${page.slug}`,
  });
  const faqLd = faqJsonLd(page.faqs);

  return (
    <main className="date-page-surface min-h-screen bg-[#fbfaf7]">
      <div className="date-page-aura" aria-hidden="true" />
      <script id="date-purpose-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="date-purpose-app-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script id="date-purpose-faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="date-purpose-intro panel">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.heading}</h1>
          <p>{page.intro}</p>
        </section>

        <DateView
          initialMode="finder"
          initialFinderTask={page.task}
          initialFinderFrom={query.from}
          initialFinderTo={query.to}
          initialBirthYear={query.birthYear}
        />

        <section className="date-purpose-guide panel mt-8">
          <div className="date-purpose-grid">
            <article>
              <p className="eyebrow">Tiêu chí chấm</p>
              <h2>Vì sao một ngày được xếp cao?</h2>
              <ul>
                {page.criteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <p className="eyebrow">Yếu tố thay đổi</p>
              <h2>Khi nào kết quả có thể khác?</h2>
              <ul>
                {page.changeFactors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <section className="date-purpose-range" aria-labelledby="date-purpose-range-title">
            <h2 id="date-purpose-range-title">Cách chọn khoảng ngày</h2>
            <ol>
              {page.rangeTips.map((item, index) => (
                <li key={item}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="date-purpose-table" aria-labelledby="date-purpose-table-title">
            <h2 id="date-purpose-table-title">Bảng giải thích nhanh</h2>
            <div>
              {page.tableRows.map((row) => (
                <article key={row.label}>
                  <strong>{row.label}</strong>
                  <p>{row.meaning}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="date-purpose-faq" aria-labelledby="date-purpose-faq-title">
            <h2 id="date-purpose-faq-title">Câu hỏi thường gặp</h2>
            <div>
              {page.faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
