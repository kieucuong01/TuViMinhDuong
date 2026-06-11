import Link from "next/link";
import Image from "next/image";
import { listArticleCategories, listArticles } from "@/lib/data";
import { routeMetadata } from "@/lib/metadata";
import { itemListJsonLd, webPageJsonLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata = routeMetadata({
  title: "Kiến thức tử vi cho người mới",
  description: "Bài viết kiến thức tử vi dễ đọc về cách lập lá số, cung mệnh, vận hạn, xem ngày và ứng dụng trong đời sống.",
  path: "/kien-thuc-tu-vi",
  imageSubtitle: "Học cách đọc lá số, 12 cung, đại vận, nguyệt vận và nhật vận",
});

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [{ category }, articles, categories] = await Promise.all([searchParams, listArticles(), listArticleCategories()]);
  const visibleArticles = category ? articles.filter((article) => article.category?.slug === category) : articles;
  const pageLd = webPageJsonLd({
    name: "Kiến thức tử vi cho người mới",
    description: "Bài viết kiến thức tử vi dễ đọc về cách lập lá số, cung mệnh, vận hạn, xem ngày và ứng dụng trong đời sống.",
    url: "/kien-thuc-tu-vi",
    breadcrumb: [
      { name: "Trang chủ", url: "/" },
      { name: "Kiến thức tử vi", url: "/kien-thuc-tu-vi" },
    ],
  });
  const itemListLd = itemListJsonLd(
    visibleArticles.slice(0, 12).map((article) => ({
      name: article.title,
      url: `/kien-thuc-tu-vi/${article.slug}`,
    })),
  );
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  const beginnerPath = [
    "la-so-tu-vi-la-gi",
    "cach-doc-la-so-tu-vi-cho-nguoi-moi",
    "cung-menh-cung-than",
    "12-cung-trong-la-so-tu-vi",
    "sao-chinh-tinh-tu-vi",
    "dai-van-la-gi",
  ]
    .map((slug) => bySlug.get(slug))
    .filter(Boolean);
  const palaceCluster = [
    "cung-tai-bach-trong-tu-vi",
    "cung-quan-loc-trong-tu-vi",
    "cung-phu-the-trong-tu-vi",
    "cung-phuc-duc-trong-tu-vi",
    "cung-dien-trach-trong-tu-vi",
    "cung-tu-tuc-trong-tu-vi",
    "cung-no-boc-trong-tu-vi",
    "cung-tat-ach-trong-tu-vi",
    "cung-thien-di-trong-tu-vi",
  ]
    .map((slug) => bySlug.get(slug))
    .filter(Boolean);

  return (
    <main className="knowledge-page-surface section">
      <div className="knowledge-page-orbit" aria-hidden="true" />
      <script id="knowledge-page-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="knowledge-list-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-heading">
          <p className="eyebrow">Kiến thức tử vi</p>
          <h1>Bài viết dễ đọc cho người mới bắt đầu</h1>
        </div>
        <section className="mb-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]" aria-label="Cụm bài nên đọc">
          <div className="knowledge-path-panel rounded-[1.5rem] border border-orange-100 bg-white/90 p-5 shadow-sm sm:p-6">
            <p className="eyebrow">Nên đọc theo thứ tự</p>
            <h2 className="mt-2 text-2xl font-black text-stone-950">Bắt đầu từ lá số, rồi đi vào cung và vận hạn</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {beginnerPath.map((article, index) => (
                <Link key={article!.slug} href={`/kien-thuc-tu-vi/${article!.slug}`} className="knowledge-path-card group rounded-2xl border border-stone-100 bg-orange-50/40 p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50">
                  <span className="text-sm font-black text-orange-600">Bước {index + 1}</span>
                  <h3 className="mt-2 text-lg font-black text-stone-950 group-hover:text-orange-700">{article!.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{article!.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
          <aside className="knowledge-palace-panel rounded-[1.5rem] border border-orange-100 bg-orange-50/70 p-5 sm:p-6">
            <p className="eyebrow">Cụm 12 cung</p>
            <h2 className="mt-2 text-xl font-black text-stone-950">Các cung được tìm nhiều</h2>
            <div className="mt-4 grid gap-2">
              {palaceCluster.map((article) => (
                <Link key={article!.slug} href={`/kien-thuc-tu-vi/${article!.slug}`} className="knowledge-palace-link rounded-2xl bg-white/80 px-4 py-3 text-base font-bold text-stone-800 transition hover:bg-white hover:text-orange-700">
                  {article!.title}
                </Link>
              ))}
            </div>
            <Link href="/#lap-la-so" className="btn btn-primary mt-5 w-full justify-center">
              Lập lá số miễn phí
            </Link>
          </aside>
        </section>
        <section className="knowledge-cta-band" aria-label="Lập lá số sau khi đọc kiến thức">
          <div>
            <p className="eyebrow">Đọc theo đúng lá số của bạn</p>
            <h2>Lập lá số miễn phí để đối chiếu kiến thức với 12 cung của chính mình</h2>
          </div>
          <div className="knowledge-cta-actions">
            <Link href="/#lap-la-so" className="btn btn-primary">
              Lập lá số miễn phí
            </Link>
            <Link href="/xem-ngay" className="btn btn-ghost">
              Xem ngày tốt xấu
            </Link>
          </div>
        </section>
        <nav className="knowledge-category-nav" aria-label="Danh mục kiến thức">
          <Link href="/kien-thuc-tu-vi" className={!category ? "active" : ""}>Tất cả</Link>
          {categories.map((item) => (
            <Link key={item.id} href={`/kien-thuc-tu-vi?category=${item.slug}`} className={category === item.slug ? "active" : ""}>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article) => (
            <Link key={article.slug} href={`/kien-thuc-tu-vi/${article.slug}`} className="article-card">
              {article.coverImage ? (
                <span className="article-thumb image">
                  <Image src={article.coverImage} alt={article.coverAlt || article.title} width={600} height={338} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                </span>
              ) : null}
              {article.category ? <span className="article-category-label">{article.category.name}</span> : null}
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
            </Link>
          ))}
        </div>
        {visibleArticles.length === 0 ? (
          <div className="knowledge-empty-state">
            <h2>Chưa có bài trong danh mục này</h2>
            <p>Hãy chọn “Tất cả” để xem toàn bộ bài đang xuất bản.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
