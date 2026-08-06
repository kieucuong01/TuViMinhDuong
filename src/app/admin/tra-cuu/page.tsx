import Link from "next/link";
import { redirect } from "next/navigation";
import { savePseoPageAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { getCurrentUser } from "@/lib/auth";
import { getAdminPseoPage, listAdminPseoPages } from "@/lib/pseo-data";

export const metadata = { title: "Admin Tra cứu pSEO", robots: { index: false, follow: false } };

function pseoStatusLabel(status: string) {
  if (status === "PUBLISHED") return "Đã publish";
  if (status === "ARCHIVED") return "Lưu trữ";
  return "Nháp";
}

export default async function AdminPseoPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; status?: string; q?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin/tra-cuu");
  const params = await searchParams;
  const pages = await listAdminPseoPages();
  const query = (params.q || "").trim().toLocaleLowerCase("vi");
  const status = (params.status || "").toUpperCase();
  const filtered = pages.filter((page) => {
    if (status && page.status !== status) return false;
    return !query || `${page.title} ${page.slug}`.toLocaleLowerCase("vi").includes(query);
  });
  const editing = params.edit ? await getAdminPseoPage(params.edit) : null;
  const publishedCount = pages.filter((page) => page.status === "PUBLISHED").length;
  const draftCount = pages.filter((page) => page.status === "DRAFT").length;
  const archivedCount = pages.filter((page) => page.status === "ARCHIVED").length;

  return (
    <main className="section admin-main admin-pseo-page">
      <div className="admin-shell-bar mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Thanh quản trị nhanh">
        <Link href="/admin" className="admin-shell-brand" prefetch={false}>
          <strong>LS Admin</strong>
          <span>Tra cứu pSEO</span>
        </Link>
        <nav aria-label="Lối tắt admin">
          <Link href="/admin?tab=overview" prefetch={false}>Tổng quan</Link>
          <Link href="/admin?tab=content" prefetch={false}>CMS</Link>
          <Link href="/admin/tra-cuu" prefetch={false}>pSEO</Link>
          <Link href="/tra-cuu" prefetch={false}>Hub public</Link>
        </nav>
        <span>{user.email}</span>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="admin-hero">
          <div>
            <p className="eyebrow">CMS Programmatic SEO</p>
            <h1 className="section-title">Tra cứu pSEO</h1>
            <p>Sửa, preview và publish từng trang. Trang không vượt audit sẽ tự giữ trạng thái nháp.</p>
          </div>
          <Link href="/admin?tab=content" className="btn btn-ghost">Về Admin CMS</Link>
        </header>
        {params.saved ? <p className="success mt-4">Đã lưu {params.saved}.</p> : null}
        <form className="admin-pseo-filter" aria-label="Lọc trang pSEO">
          <label htmlFor="admin-pseo-query">
            <span>Tìm kiếm</span>
            <input id="admin-pseo-query" name="q" defaultValue={params.q || ""} placeholder="Tìm theo tiêu đề hoặc slug" />
          </label>
          <label htmlFor="admin-pseo-status">
            <span>Trạng thái</span>
            <select id="admin-pseo-status" name="status" defaultValue={params.status || ""}>
              <option value="">Mọi trạng thái</option>
              <option value="PUBLISHED">Đã publish</option>
              <option value="DRAFT">Nháp</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
          </label>
          <button className="btn btn-ghost" type="submit">Lọc</button>
        </form>
        <div className="admin-pseo-layout">
          <section className="panel admin-pseo-list">
            <div className="admin-pseo-results-head">
              <div>
                <p className="eyebrow">Danh sách trang</p>
                <h2>Hiển thị {filtered.length} / {pages.length} trang</h2>
              </div>
              <div className="admin-pseo-stats" aria-label="Tổng hợp trạng thái pSEO">
                <span><strong>{publishedCount}</strong> publish</span>
                <span><strong>{draftCount}</strong> nháp</span>
                <span><strong>{archivedCount}</strong> lưu trữ</span>
              </div>
            </div>
            <div className="admin-pseo-list-grid">
              {filtered.map((item) => (
                <article key={item.slug} className={item.slug === editing?.slug ? "active" : ""}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>/{item.slug}</span>
                    <em className={`admin-pseo-status-pill ${item.status.toLowerCase()}`}>{pseoStatusLabel(item.status)}</em>
                  </div>
                  <div className="admin-pseo-actions">
                    <Link href={`/admin/tra-cuu?edit=${item.slug}`} className="btn btn-ghost btn-small">Sửa</Link>
                    {item.status === "PUBLISHED" ? <Link href={`/tra-cuu/${item.slug}`} className="btn btn-ghost btn-small">Xem trang</Link> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
          {editing ? (
            <section className="panel admin-pseo-editor">
              <h2>{editing.title}</h2>
              <form action={savePseoPageAction} data-loading-message="Đang lưu trang tra cứu...">
                <input type="hidden" name="slug" value={editing.slug} />
                <label><span>Tiêu đề</span><input name="title" defaultValue={editing.title} required /></label>
                <label><span>Trạng thái</span><select name="status" defaultValue={editing.status}>
                  <option value="DRAFT">Nháp</option><option value="PUBLISHED">Publish</option><option value="ARCHIVED">Lưu trữ</option>
                </select></label>
                <label><span>Excerpt</span><textarea name="excerpt" rows={3} defaultValue={editing.excerpt} /></label>
                <label><span>Meta title</span><input name="metaTitle" defaultValue={editing.metaTitle} /></label>
                <label><span>Meta description</span><textarea name="metaDescription" rows={2} defaultValue={editing.metaDescription} /></label>
                <label><span>Canonical</span><input name="canonicalUrl" defaultValue={editing.canonicalUrl} /></label>
                <label><span>Nội dung Markdown</span><textarea name="body" rows={24} defaultValue={editing.body} /></label>
                <div className="admin-submit-row">
                  <LoadingSubmitButton className="btn btn-primary" loadingText="Đang lưu..." confirmMessage="Xác nhận lưu trang pSEO? Hệ thống sẽ chạy audit trước khi publish.">Lưu và chạy audit</LoadingSubmitButton>
                  {editing.status === "PUBLISHED" ? <Link href={`/tra-cuu/${editing.slug}`} className="btn btn-ghost">Xem trang</Link> : null}
                </div>
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
