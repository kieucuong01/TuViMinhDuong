import Link from "next/link";
import { Eye, FilePenLine, Plus, SearchCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { saveArticleAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { getAdminArticleBySlug, getAdminOverview, listAdminArticles } from "@/lib/data";
import type { ArticleView } from "@/lib/content";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

function emptyArticle(): ArticleView {
  return {
    id: "new",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft",
    coverImage: "/articles/la-so-12-cung.svg",
    coverAlt: "",
    focusKeyword: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    robots: "index,follow",
    schemaType: "Article",
    seoScore: 0,
    seoChecklist: [],
    publishedAt: null,
    updatedAt: null,
  };
}

function readableDate(date?: Date | null) {
  return date ? new Date(date).toLocaleDateString("vi-VN") : "Chưa xuất bản";
}

function seoTone(score = 0) {
  if (score >= 80) return "good";
  if (score >= 60) return "ok";
  return "low";
}

function statusLabel(status: string) {
  if (status === "published") return "Xuất bản";
  if (status === "archived") return "Lưu trữ";
  return "Nháp";
}

function seoChecks(article: ArticleView) {
  if (!Array.isArray(article.seoChecklist)) return [];
  return article.seoChecklist
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { label?: unknown; passed?: unknown; hint?: unknown };
      return {
        label: String(record.label || "SEO check"),
        passed: Boolean(record.passed),
        hint: String(record.hint || ""),
      };
    })
    .filter(Boolean) as Array<{ label: string; passed: boolean; hint: string }>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; edit?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");

  const params = await searchParams;
  const [overview, articles, editingArticle] = await Promise.all([
    getAdminOverview(),
    listAdminArticles(),
    params.edit ? getAdminArticleBySlug(params.edit) : Promise.resolve(null),
  ]);
  const article = editingArticle || emptyArticle();
  const checks = seoChecks(article);

  return (
    <main className="section" data-testid="admin-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="admin-hero">
          <div>
            <p className="eyebrow">Admin CMS</p>
            <h1 className="section-title">Quản trị bài viết, SEO và xuất bản</h1>
            <p>Viết bài mới, lưu nháp, xuất bản, xem SEO score và mở lại bài để chỉnh sửa từ cùng một màn hình.</p>
          </div>
          <Link href="/admin" className="btn btn-primary">
            <Plus size={18} /> Tạo bài mới
          </Link>
        </div>

        {params.saved ? <p className="success mt-4">Đã lưu bài viết: {params.saved}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-5">
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

        <div className="admin-cms-grid">
          <section className="panel admin-editor-panel">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">CMS bài viết</p>
                <h2>{editingArticle ? "Sửa bài SEO" : "Tạo bài SEO mới"}</h2>
              </div>
              {editingArticle?.status === "published" ? (
                <Link href={`/kien-thuc-tu-vi/${editingArticle.slug}`} className="btn btn-ghost btn-small" prefetch={false}>
                  <Eye size={17} /> Xem public
                </Link>
              ) : null}
              {editingArticle ? (
                <Link href={`/admin/preview/${editingArticle.slug}`} className="btn btn-ghost btn-small" prefetch={false}>
                  <Eye size={17} /> Preview
                </Link>
              ) : null}
            </div>

            <form action={saveArticleAction} className="admin-article-form" data-testid="admin-article-form" data-loading-message="Đang lưu bài viết..." data-loading-label="Đang lưu...">
              <input type="hidden" name="originalSlug" value={article.slug} />

              <div className="admin-form-row">
                <label><span>Tiêu đề</span><input name="title" defaultValue={article.title} required data-testid="admin-article-title" /></label>
                <label>
                  <span>Trạng thái</span>
                  <select name="status" defaultValue={article.status === "published" || article.status === "archived" ? article.status : "draft"} data-testid="admin-article-status">
                    <option value="draft">Nháp</option>
                    <option value="published">Xuất bản</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </label>
              </div>

              <div className="admin-form-row">
                <label><span>Slug</span><input name="slug" defaultValue={article.slug} placeholder="tu-khoa-bai-viet" data-testid="admin-article-slug" /></label>
                <label><span>Focus keyword</span><input name="focusKeyword" defaultValue={article.focusKeyword || ""} data-testid="admin-article-focus-keyword" /></label>
              </div>

              <label><span>Excerpt</span><textarea name="excerpt" rows={3} defaultValue={article.excerpt} data-testid="admin-article-excerpt" /></label>

              <div className="admin-form-row">
                <label><span>Meta title</span><input name="metaTitle" defaultValue={article.metaTitle || ""} data-testid="admin-article-meta-title" /></label>
                <label><span>Canonical URL</span><input name="canonicalUrl" defaultValue={article.canonicalUrl || (article.slug ? `/kien-thuc-tu-vi/${article.slug}` : "")} data-testid="admin-article-canonical" /></label>
              </div>

              <label><span>Meta description</span><textarea name="metaDescription" rows={2} defaultValue={article.metaDescription || ""} data-testid="admin-article-meta-description" /></label>

              <div className="admin-form-row">
                <label><span>Ảnh đại diện</span><input name="coverImage" defaultValue={article.coverImage || ""} data-testid="admin-article-cover-image" /></label>
                <label><span>Alt ảnh đại diện</span><input name="coverAlt" defaultValue={article.coverAlt || ""} data-testid="admin-article-cover-alt" /></label>
              </div>

              <label><span>Nội dung Markdown</span><textarea name="content" rows={16} defaultValue={article.content} data-testid="admin-article-content" /></label>

              <div className="admin-submit-row">
                <button className="btn btn-primary" type="submit" data-testid="admin-article-submit">
                  <FilePenLine size={18} /> Lưu bài và chấm SEO
                </button>
                <span>Chỉ trạng thái “Xuất bản” hiện ngoài public. Nháp và Lưu trữ chỉ xem được trong admin preview.</span>
              </div>
            </form>
          </section>

          <aside className="grid gap-6">
            <section className="panel">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">SEO checklist</p>
                  <h2>Điểm hiện tại</h2>
                </div>
                <span className={`admin-seo-score ${seoTone(article.seoScore)}`}>{article.seoScore || 0}/100</span>
              </div>
              {checks.length ? (
                <div className="admin-seo-checks">
                  {checks.map((check) => (
                    <div key={check.label} data-pass={check.passed ? "true" : "false"}>
                      <SearchCheck size={17} />
                      <span>
                        <strong>{check.label}</strong>
                        {check.hint ? <small>{check.hint}</small> : null}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-600">Lưu bài một lần để hệ thống chấm SEO và hiện checklist.</p>
              )}
            </section>

            <section className="panel">
              <p className="eyebrow">SEO preview</p>
              <div className="admin-serp-preview">
                <span>{article.canonicalUrl || (article.slug ? `/kien-thuc-tu-vi/${article.slug}` : "/kien-thuc-tu-vi/slug-bai-viet")}</span>
                <strong>{article.metaTitle || article.title || "Tiêu đề SEO sẽ hiển thị ở đây"}</strong>
                <p>{article.metaDescription || article.excerpt || "Meta description giúp người đọc hiểu nhanh nội dung bài viết trước khi bấm vào kết quả tìm kiếm."}</p>
              </div>
              <div className="admin-preview-hints">
                <span>Title: {(article.metaTitle || article.title || "").length}/60</span>
                <span>Description: {(article.metaDescription || article.excerpt || "").length}/160</span>
              </div>
            </section>

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
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Bài trong CMS</p>
                  <h2>{articles.length} bài</h2>
                </div>
                <Link href="/admin" className="btn btn-ghost btn-small">
                  <Plus size={17} /> Mới
                </Link>
              </div>
              <div className="admin-article-list">
                {articles.map((item) => (
                  <article key={item.slug} className={item.slug === article.slug ? "admin-article-row active" : "admin-article-row"}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>/{item.slug}</p>
                      <div className="admin-row-meta">
                        <span className={`admin-status ${item.status === "published" ? "published" : item.status === "archived" ? "archived" : "draft"}`}>{statusLabel(item.status)}</span>
                        <span className={`admin-seo-mini ${seoTone(item.seoScore)}`}>SEO {item.seoScore || 0}</span>
                        <span>{readableDate(item.publishedAt || item.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <Link href={`/admin?edit=${item.slug}`} className="btn btn-ghost btn-small" prefetch={false}>Sửa</Link>
                      <Link href={`/admin/preview/${item.slug}`} className="btn btn-ghost btn-small" prefetch={false}>Preview</Link>
                      {item.status === "published" ? (
                        <Link href={`/kien-thuc-tu-vi/${item.slug}`} className="btn btn-ghost btn-small" prefetch={false}>Xem</Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
