import Link from "next/link";
import Image from "next/image";
import { listArticles } from "@/lib/data";

export const revalidate = 300;

export const metadata = {
  title: "Kiến thức tử vi",
  description: "Bài viết kiến thức tử vi, cách lập lá số, cung mệnh, vận hạn và ứng dụng tử vi trong đời sống.",
  alternates: { canonical: "/kien-thuc-tu-vi" },
};

export default async function KnowledgePage() {
  const articles = await listArticles();

  return (
    <main className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-heading">
          <p className="eyebrow">Kiến thức tử vi</p>
          <h1>Các bài viết nền tảng, dễ đọc và tối ưu SEO</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.slug} href={`/kien-thuc-tu-vi/${article.slug}`} className="article-card">
              {article.coverImage ? (
                <span className="article-thumb image">
                  <Image src={article.coverImage} alt={article.coverAlt || article.title} width={600} height={338} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                </span>
              ) : null}
              <span className="seo-pill">SEO {article.seoScore || 0}/100</span>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
