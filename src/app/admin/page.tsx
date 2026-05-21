import { redirect } from "next/navigation";
import { saveArticleAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { getAdminOverview, listArticles } from "@/lib/data";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");
  const [overview, articles, params] = await Promise.all([getAdminOverview(), listArticles(), searchParams]);

  return (
    <main className="section" data-testid="admin-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="eyebrow">Admin CMS</p>
          <h1 className="section-title">Quản trị người dùng, xu, bài viết và SEO</h1>
          {params.saved ? <p className="success mt-4">Đã lưu bài viết: {params.saved}</p> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[
            ["Users", overview.users],
            ["Lá số", overview.charts],
            ["Readings", overview.readings],
            ["Bài viết", overview.articles],
            ["Thanh toán", overview.payments],
          ].map(([label, value]) => (
            <div key={String(label)} className="metric-card bg-white">
              <strong>{String(value)}</strong>
              <span>{String(label)}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="panel">
            <p className="eyebrow">CMS bài viết</p>
            <h2 className="text-2xl font-bold">Tạo hoặc cập nhật bài SEO</h2>
            <form action={saveArticleAction} className="mt-5 grid gap-4" data-testid="admin-article-form" data-loading-message="Đang lưu bài viết..." data-loading-label="Đang lưu...">
              <label><span>Tiêu đề</span><input name="title" defaultValue="Cách đọc cung Mệnh trong tử vi" required data-testid="admin-article-title" /></label>
              <label><span>Slug</span><input name="slug" defaultValue="cach-doc-cung-menh-trong-tu-vi" data-testid="admin-article-slug" /></label>
              <label><span>Excerpt</span><textarea name="excerpt" rows={3} defaultValue="Hướng dẫn cách đọc cung Mệnh trong lá số tử vi theo hướng ứng dụng, dễ hiểu và không mê tín cực đoan." data-testid="admin-article-excerpt" /></label>
              <label><span>Focus keyword</span><input name="focusKeyword" defaultValue="cung mệnh tử vi" data-testid="admin-article-focus-keyword" /></label>
              <label><span>Meta title</span><input name="metaTitle" defaultValue="Cách đọc cung Mệnh trong tử vi cho người mới" data-testid="admin-article-meta-title" /></label>
              <label><span>Meta description</span><textarea name="metaDescription" rows={2} defaultValue="Tìm hiểu cách đọc cung Mệnh trong tử vi, các yếu tố cần xem cùng Cung Thân, chính tinh, phụ tinh và vận hạn." data-testid="admin-article-meta-description" /></label>
              <label><span>Canonical URL</span><input name="canonicalUrl" defaultValue="/kien-thuc-tu-vi/cach-doc-cung-menh-trong-tu-vi" data-testid="admin-article-canonical" /></label>
              <label><span>Ảnh đại diện</span><input name="coverImage" defaultValue="/articles/la-so-12-cung.svg" data-testid="admin-article-cover-image" /></label>
              <label><span>Alt ảnh đại diện</span><input name="coverAlt" defaultValue="Minh họa bàn lá số tử vi 12 cung" data-testid="admin-article-cover-alt" /></label>
              <label><span>Nội dung Markdown</span><textarea name="content" rows={10} defaultValue={`Cung mệnh tử vi là điểm bắt đầu khi đọc một lá số.\n\n## Cung Mệnh cho biết điều gì\n\nCung Mệnh phản ánh khí chất, xu hướng hành động và cách một người phản ứng với hoàn cảnh.\n\n## Cần đọc cùng Cung Thân\n\nKhi kết hợp với [Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than), phần luận giải sẽ sát đời sống hơn.\n\n## Ứng dụng thực tế\n\nKhông nên xem cung Mệnh như một kết luận cố định. Hãy dùng nó như một bản đồ tham khảo để hiểu bản thân và lựa chọn tốt hơn.`} data-testid="admin-article-content" /></label>
              <button className="btn btn-primary" type="submit" data-testid="admin-article-submit">Lưu bài và chấm SEO</button>
            </form>
          </section>

          <aside className="grid gap-6">
            <section className="panel">
              <p className="eyebrow">Giá tính năng</p>
              <div className="grid gap-2 text-sm">
                {Object.entries(overview.featurePrices).map(([key, value]) => (
                  <div key={key} className="flex justify-between rounded-lg bg-orange-50 px-3 py-2">
                    <span>{value.label}</span>
                    <strong>{value.priceCoins} xu</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <p className="eyebrow">Bài đã xuất bản</p>
              <div className="grid gap-3">
                {articles.map((article) => (
                  <div key={article.slug} className="rounded-xl border border-orange-100 p-3">
                    <h3 className="font-semibold">{article.title}</h3>
                    <p className="mt-1 text-sm text-stone-600">SEO {article.seoScore || 0}/100</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
