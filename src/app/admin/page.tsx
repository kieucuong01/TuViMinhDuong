import Link from "next/link";
import { Banknote, ClipboardList, Coins, Eye, FilePenLine, Plus, ReceiptText, SearchCheck, SlidersHorizontal, Trash2, UsersRound, X } from "lucide-react";
import { redirect } from "next/navigation";
import { adjustUserCoinsAction, deleteUserAction, saveArticleAction, saveArticleCategoryAction, saveFeaturePricesAction, saveOperationSettingsAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { getAdminArticleBySlug, getAdminBusinessDashboard, getAdminOverview, listAdminArticles, listAdminChartSubmissions, listArticleCategories, normalizeAdminTrendPeriod } from "@/lib/data";
import type { ArticleView } from "@/lib/content";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { AdminArticleDeleteForm } from "@/components/admin-article-delete-form";
import { AdminTrendCharts } from "@/components/admin-trend-charts";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

type AdminTab = "overview" | "users" | "charts" | "revenue" | "content" | "settings" | "pricing";
const ARTICLES_PER_ADMIN_PAGE = 8;

const adminTabs: Array<{ id: AdminTab; label: string; helper: string; href: string }> = [
  { id: "overview", label: "Tổng quan", helper: "Chỉ số chính", href: "/admin?tab=overview" },
  { id: "users", label: "User", helper: "Tài khoản đăng ký", href: "/admin?tab=users" },
  { id: "charts", label: "Lá số", helper: "Form đã submit", href: "/admin?tab=charts" },
  { id: "revenue", label: "Doanh thu", helper: "Đơn hàng và dòng tiền", href: "/admin?tab=revenue" },
  { id: "content", label: "Bài viết", helper: "CMS và SEO", href: "/admin?tab=content" },
  { id: "settings", label: "Cấu hình", helper: "Bật/tắt vận hành", href: "/admin?tab=settings" },
  { id: "pricing", label: "Giá", helper: "Xu từng tính năng", href: "/admin?tab=pricing" },
];

function normalizeAdminTab(params: { tab?: string; edit?: string; saved?: string; categorySaved?: string; deleted?: string; settingsSaved?: string; userAdjusted?: string; userDeleted?: string; userError?: string; pricingSaved?: string; pricingError?: string; articleModal?: string; articlePage?: string; trend?: string }): AdminTab {
  if (params.edit || params.saved || params.categorySaved || params.deleted) return "content";
  if (params.settingsSaved) return "settings";
  if (params.userAdjusted || params.userDeleted || params.userError) return "users";
  if (params.pricingSaved || params.pricingError) return "pricing";
  return adminTabs.some((tab) => tab.id === params.tab) ? (params.tab as AdminTab) : "overview";
}

function clampPage(value: string | undefined, pageCount: number) {
  const parsed = Number.parseInt(value || "1", 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), pageCount);
}

function adminContentHref(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams({ tab: "content" });
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    query.set(key, String(value));
  });
  return `/admin?${query.toString()}`;
}

function emptyArticle(): ArticleView {
  return {
    id: "new",
    categoryId: null,
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
    faqs: [],
    seoScore: 0,
    seoChecklist: [],
    publishedAt: null,
    updatedAt: null,
  };
}

function readableDate(date?: Date | null) {
  return date ? new Date(date).toLocaleDateString("vi-VN") : "Chưa xuất bản";
}

function readableDateTime(date?: Date | null) {
  return date
    ? new Date(date).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa có";
}

function formatVnd(value = 0) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatInteger(value = 0) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatPercent(value = 0) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
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

function paymentStatusLabel(status: string) {
  if (status === "PAID") return "Đã thanh toán";
  if (status === "PENDING") return "Đang chờ";
  if (status === "CANCELLED") return "Đã hủy";
  if (status === "EXPIRED") return "Hết hạn";
  if (status === "FAILED") return "Lỗi";
  return status;
}

function roleLabel(role: string) {
  return role === "ADMIN" ? "Admin" : "User";
}

function genderLabel(gender: string) {
  return gender === "female" ? "Nữ" : "Nam";
}

function calendarTypeLabel(calendarType: string) {
  return calendarType === "lunar" ? "Âm lịch" : "Dương lịch";
}

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function chartBirthLabel(item: { day: number; month: number; year: number; birthHour: number; birthMinute: number; calendarType: string }) {
  return `${padTime(item.day)}/${padTime(item.month)}/${item.year} - ${padTime(item.birthHour)}:${padTime(item.birthMinute)}`;
}

function submitterLabel(item: { submitterType: "guest" | "user"; userName: string | null; userEmail: string | null }) {
  if (item.submitterType === "guest") return "Khách vãng lai";
  return item.userName || item.userEmail || "User đã đăng nhập";
}

function submitterDetail(item: { submitterType: "guest" | "user"; userId: string | null; userEmail: string | null }) {
  if (item.submitterType === "guest") return "Không gắn tài khoản";
  return item.userEmail || item.userId || "User đã đăng nhập";
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

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string; edit?: string; categorySaved?: string; deleted?: string; settingsSaved?: string; userAdjusted?: string; userDeleted?: string; userError?: string; pricingSaved?: string; pricingError?: string; articleModal?: string; articlePage?: string; trend?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");

  const params = await searchParams;
  const activeTab = normalizeAdminTab(params);
  const requestedTrendPeriod = normalizeAdminTrendPeriod(params.trend);
  const [overview, business, chartSubmissions, articles, categories, editingArticle] = await Promise.all([
    getAdminOverview(requestedTrendPeriod),
    getAdminBusinessDashboard(),
    activeTab === "charts" ? listAdminChartSubmissions() : Promise.resolve([]),
    listAdminArticles(),
    listArticleCategories(),
    params.edit ? getAdminArticleBySlug(params.edit) : Promise.resolve(null),
  ]);
  const article = editingArticle || emptyArticle();
  const operationSettings = overview.operationSettings;
  const checks = seoChecks(article);
  const faqRows = [...(article.faqs || []), ...Array.from({ length: 5 }, () => ({ question: "", answer: "" }))].slice(0, 5);
  const articlePageCount = Math.max(1, Math.ceil(articles.length / ARTICLES_PER_ADMIN_PAGE));
  const articlePage = clampPage(params.articlePage, articlePageCount);
  const paginatedArticles = articles.slice((articlePage - 1) * ARTICLES_PER_ADMIN_PAGE, articlePage * ARTICLES_PER_ADMIN_PAGE);
  const isArticleModalOpen = activeTab === "content" && (params.articleModal === "new" || Boolean(params.edit));
  const closeArticleModalHref = adminContentHref({ articlePage });
  const trendPeriod = normalizeAdminTrendPeriod(overview.trendPeriod);
  const reportMetrics = [
    { label: "Tổng Tài khoản", value: formatInteger(overview.users), note: "Tài khoản đã đăng ký" },
    { label: "Lá số được lập", value: formatInteger(overview.charts), note: "Tổng form lập lá số đã lưu" },
    { label: "Luận giải đã mở khóa", value: formatInteger(overview.unlockedReadings), note: `${formatInteger(overview.readings)} lượt luận giải trong hệ thống` },
    { label: "Tổng số Bài viết SEO", value: formatInteger(overview.seoArticles), note: "CMS bài viết không bị xóa" },
    { label: "Tổng số Bài viết pSEO", value: formatInteger(overview.pseoArticles), note: "Trang tra cứu published và entity pSEO" },
    { label: "Tỷ lệ Lá số vãng lai", value: formatPercent(overview.guestChartRate), note: `${formatInteger(overview.guestCharts)} / ${formatInteger(overview.charts)} lá số không gắn tài khoản` },
    { label: "Số Sitemap", value: formatInteger(overview.sitemapFiles), note: `${formatInteger(overview.sitemapMainUrls)} URL trong sitemap chính` },
  ];

  return (
    <main className="section" data-testid="admin-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="admin-hero">
          <Link href="/admin/tra-cuu" className="btn btn-ghost">Tra cứu pSEO</Link>
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="section-title">Quản trị hệ thống Lá số tinh hoa</h1>
            <p>Chọn từng mục bên dưới để quản lý user, doanh thu, bài viết, giá và cấu hình vận hành gọn hơn.</p>
          </div>
          <Link href="/admin?tab=content&articleModal=new" className="btn btn-primary">
            <Plus size={18} /> Tạo bài mới
          </Link>
        </div>

        {params.saved ? <p className="success mt-4">Đã lưu bài viết: {params.saved}</p> : null}
        {params.categorySaved ? <p className="success mt-4">Đã lưu danh mục: {params.categorySaved}</p> : null}
        {params.deleted ? <p className="success mt-4">Đã xóa bài viết: {params.deleted}</p> : null}
        {params.settingsSaved ? <p className="success mt-4">Đã cập nhật cấu hình vận hành.</p> : null}
        {params.userAdjusted ? <p className="success mt-4">Đã cập nhật xu cho user: {params.userAdjusted}</p> : null}
        {params.userDeleted ? <p className="success mt-4">Đã xóa user: {params.userDeleted}</p> : null}
        {params.userError ? <p className="alert mt-4">{params.userError}</p> : null}
        {params.pricingSaved ? <p className="success mt-4">Đã cập nhật bảng giá luận giải.</p> : null}
        {params.pricingError ? <p className="alert mt-4">{params.pricingError}</p> : null}

        <nav className="admin-tabs" aria-label="Mục quản trị">
          {adminTabs.map((tab) => (
            <Link key={tab.id} href={tab.href} className={tab.id === activeTab ? "admin-tab-link active" : "admin-tab-link"} aria-current={tab.id === activeTab ? "page" : undefined} prefetch={false}>
              <strong>{tab.label}</strong>
              <span>{tab.helper}</span>
            </Link>
          ))}
        </nav>

        {activeTab === "overview" ? <section className="admin-tab-section">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Báo cáo</p>
              <h2>Tổng quan dự án</h2>
            </div>
          </div>
          <div className="admin-report-metrics">
            {reportMetrics.map((metric) => (
              <article key={metric.label} className="admin-report-metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.note}</small>
              </article>
            ))}
          </div>

          <AdminTrendCharts initialPeriod={trendPeriod} trendGroups={overview.trendGroups} />
        </section> : null}

        {activeTab === "revenue" ? <section className="admin-business-grid admin-tab-section">
          <div className="panel admin-revenue-panel">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Doanh thu</p>
                <h2>Tổng quan đơn hàng và dòng tiền</h2>
              </div>
              <span className="admin-operation-status">
                <Banknote size={17} /> {business.revenue.paidOrders} đơn đã thanh toán
              </span>
            </div>
            <div className="admin-revenue-grid">
              <article className="admin-revenue-card primary">
                <span><Banknote size={18} /> Tổng doanh thu</span>
                <strong>{formatVnd(business.revenue.totalPaidVnd)}</strong>
              </article>
              <article className="admin-revenue-card">
                <span>Tháng này</span>
                <strong>{formatVnd(business.revenue.currentMonthPaidVnd)}</strong>
              </article>
              <article className="admin-revenue-card">
                <span>30 ngày gần nhất</span>
                <strong>{formatVnd(business.revenue.last30DaysPaidVnd)}</strong>
              </article>
            </div>
            <div className="admin-payment-summary">
              <span className="paid">Đã thanh toán: {business.revenue.paidOrders}</span>
              <span>Đang chờ: {business.revenue.pendingOrders}</span>
              <span>Đã hủy: {business.revenue.cancelledOrders}</span>
              <span>Lỗi/hết hạn: {business.revenue.failedOrders + business.revenue.expiredOrders}</span>
            </div>
            <div className="admin-source-grid" aria-label="Nguồn doanh thu">
              <div>
                <span>Nạp xu</span>
                <strong>{formatVnd(business.revenue.coinTopupPaidVnd)}</strong>
              </div>
              <div>
                <span>Luận giải nhanh</span>
                <strong>{formatVnd(business.revenue.quickReadingPaidVnd)}</strong>
              </div>
              <div>
                <span>Khác</span>
                <strong>{formatVnd(business.revenue.otherPaidVnd)}</strong>
              </div>
            </div>
          </div>

          <aside className="panel admin-recent-payments-panel">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Đơn gần đây</p>
                <h2>Thanh toán mới nhất</h2>
              </div>
              <ReceiptText size={22} className="text-orange-700" />
            </div>
            <div className="admin-payment-list">
              {business.recentPayments.length ? business.recentPayments.map((payment) => (
                <article key={payment.id} className="admin-payment-row">
                  <div>
                    <strong>{formatVnd(payment.amountVnd)}</strong>
                    <span>{payment.email}</span>
                    <small>#{payment.orderCode} - {payment.sourceLabel}</small>
                  </div>
                  <div>
                    <em className={`admin-payment-status ${payment.status.toLowerCase()}`}>{paymentStatusLabel(payment.status)}</em>
                    <small>{readableDateTime(payment.paidAt || payment.createdAt)}</small>
                  </div>
                </article>
              )) : (
                <p className="admin-empty-note">Chưa có đơn thanh toán nào.</p>
              )}
            </div>
          </aside>
        </section> : null}

        {activeTab === "users" ? <section className="panel admin-users-panel admin-tab-section">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">User đã đăng ký</p>
              <h2>Người dùng mới nhất</h2>
            </div>
            <span className="admin-operation-status">
              <UsersRound size={17} /> {overview.users} tài khoản
            </span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Lá số</th>
                  <th>Luận giải</th>
                  <th>Xu</th>
                  <th>Đơn đã thanh toán</th>
                  <th>Tổng chi</th>
                  <th>Lần thanh toán gần nhất</th>
                  <th>Thao tác admin</th>
                </tr>
              </thead>
              <tbody>
                {business.recentUsers.length ? business.recentUsers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name || item.email}</strong>
                      <span>{item.email}</span>
                    </td>
                    <td><em className={`admin-role-pill ${item.role.toLowerCase()}`}>{roleLabel(item.role)}</em></td>
                    <td>{readableDate(item.createdAt)}</td>
                    <td>{item.chartsCount}</td>
                    <td>{item.readingsCount}</td>
                    <td>{item.coinBalance}</td>
                    <td>{item.paidOrdersCount}</td>
                    <td>{formatVnd(item.totalPaidVnd)}</td>
                    <td>{readableDateTime(item.lastPaymentAt)}</td>
                    <td className="admin-user-action-cell">
                      <div className="admin-user-actions">
                        <form action={adjustUserCoinsAction} className="admin-user-credit-form" data-testid={`admin-user-coins-${item.id}`} data-loading-message="Đang cập nhật xu..." data-loading-label="Đang cập nhật...">
                          <input type="hidden" name="userId" value={item.id} />
                          <label>
                            <span>Số xu</span>
                            <input name="amount" type="number" inputMode="numeric" min="1" step="1" placeholder="Xu" required aria-label={`Số xu cho ${item.email}`} />
                          </label>
                          <label>
                            <span>Lý do</span>
                            <input name="reason" placeholder="Lý do" aria-label={`Lý do chỉnh xu cho ${item.email}`} />
                          </label>
                          <div className="admin-user-credit-buttons">
                            <LoadingSubmitButton className="btn btn-primary btn-small" name="direction" value="credit" loadingText="Đang cộng...">
                              <Coins size={15} /> Cộng
                            </LoadingSubmitButton>
                            <LoadingSubmitButton className="btn btn-ghost btn-small" name="direction" value="debit" loadingText="Đang thu...">
                              Thu hồi
                            </LoadingSubmitButton>
                          </div>
                        </form>
                        <form action={deleteUserAction} className="admin-user-delete-form" data-loading-message="Đang xóa user..." data-loading-label="Đang xóa...">
                          <input type="hidden" name="userId" value={item.id} />
                          <LoadingSubmitButton className="btn btn-danger btn-small" loadingText="Đang xóa..." disabled={item.role === "ADMIN" || item.id === user.id} data-testid={`admin-user-delete-${item.id}`}>
                            <Trash2 size={15} /> Xóa user
                          </LoadingSubmitButton>
                          {item.role === "ADMIN" || item.id === user.id ? <small>Không xóa tài khoản admin.</small> : <small>Xóa vĩnh viễn user và dữ liệu phụ thuộc.</small>}
                        </form>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={10}>
                      <span>Chưa có user nào trong dữ liệu hiện tại.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section> : null}

        {activeTab === "charts" ? <section className="panel admin-chart-submissions-panel admin-tab-section" data-testid="admin-chart-submissions">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Form lập lá số</p>
              <h2>Lá số đã được submit gần đây</h2>
            </div>
            <span className="admin-operation-status">
              <ClipboardList size={17} /> {overview.charts} lá số
            </span>
          </div>
          <p className="admin-board-note">
            Hiển thị tối đa {chartSubmissions.length} bản ghi mới nhất, bao gồm cả Khách vãng lai và User đã đăng nhập.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Thời gian submit</th>
                  <th>Người submit</th>
                  <th>Họ tên nhập form</th>
                  <th>Ngày giờ sinh</th>
                  <th>Lịch</th>
                  <th>Giới tính</th>
                  <th>Năm xem</th>
                  <th>Múi giờ</th>
                  <th>Lá số</th>
                </tr>
              </thead>
              <tbody>
                {chartSubmissions.length ? chartSubmissions.map((item) => (
                  <tr key={item.id}>
                    <td>{readableDateTime(item.createdAt)}</td>
                    <td>
                      <strong>{submitterLabel(item)}</strong>
                      <span>{submitterDetail(item)}</span>
                      <em className={`admin-role-pill ${item.submitterType === "guest" ? "guest" : "user"}`}>
                        {item.submitterType === "guest" ? "Khách vãng lai" : "User đã đăng nhập"}
                      </em>
                    </td>
                    <td>
                      <strong>{item.fullName}</strong>
                      <span>{item.title}</span>
                    </td>
                    <td>{chartBirthLabel(item)}</td>
                    <td>{calendarTypeLabel(item.calendarType)}</td>
                    <td>{genderLabel(item.gender)}</td>
                    <td>{item.viewYear}</td>
                    <td>{item.timezone}</td>
                    <td>
                      <Link href={`/la-so/${item.id}`} className="btn btn-ghost btn-small" prefetch={false}>
                        Mở lá số
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9}>
                      <span>Chưa có form lập lá số nào trong dữ liệu hiện tại.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section> : null}

        {activeTab === "settings" ? <section className="panel admin-operations-panel admin-tab-section">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Cấu hình vận hành</p>
              <h2>Bật/tắt thanh toán, nạp xu và luận giải chuyên sâu</h2>
            </div>
            <span className="admin-operation-status">
              <SlidersHorizontal size={17} /> {operationSettings.paidReadingsEnabled ? "Đang bán luận giải" : "Public chỉ xem bản cơ bản"}
            </span>
          </div>
          <form action={saveOperationSettingsAction} className="admin-operation-form" data-loading-message="Đang lưu cấu hình..." data-loading-label="Đang lưu...">
            <label className="admin-operation-toggle">
              <input type="checkbox" name="paymentsEnabled" value="1" defaultChecked={operationSettings.paymentsEnabled} />
              <span>
                <strong>Thanh toán PayOS/VietQR</strong>
                <small>Tắt thì hệ thống không tạo link thanh toán mới.</small>
              </span>
            </label>
            <label className="admin-operation-toggle">
              <input type="checkbox" name="coinTopupEnabled" value="1" defaultChecked={operationSettings.coinTopupEnabled} />
              <span>
                <strong>Nạp xu</strong>
                <small>Tắt thì ẩn menu, modal và trang nạp xu với người dùng thường.</small>
              </span>
            </label>
            <label className="admin-operation-toggle">
              <input type="checkbox" name="paidReadingsEnabled" value="1" defaultChecked={operationSettings.paidReadingsEnabled} />
              <span>
                <strong>Luận giải chuyên sâu cho public</strong>
                <small>Tắt thì ẩn Luận cung, Đại vận, Tiểu vận, Nguyệt vận, Nhật vận và Luận giải toàn bộ với non-admin. Admin vẫn toàn quyền.</small>
              </span>
            </label>
            <div className="admin-operation-actions">
              <LoadingSubmitButton className="btn btn-primary" name="mode" value="custom" loadingText="Đang lưu...">
                Lưu cấu hình
              </LoadingSubmitButton>
              <LoadingSubmitButton className="btn btn-ghost" name="mode" value="basic-free" loadingText="Đang tắt...">
                Tắt trả phí public
              </LoadingSubmitButton>
              <LoadingSubmitButton className="btn btn-ghost" name="mode" value="commercial" loadingText="Đang bật...">
                Bật lại thương mại
              </LoadingSubmitButton>
            </div>
          </form>
        </section> : null}

        {activeTab === "content" ? <div className="admin-cms-grid admin-tab-section">
          <section className="panel admin-article-board">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Bài viết hiện tại</p>
                <h2>Quản lý toàn bộ bài trong CMS</h2>
              </div>
              <Link href="/admin?tab=content&articleModal=new" className="btn btn-primary btn-small" prefetch={false}>
                <Plus size={17} /> Tạo bài mới
              </Link>
            </div>
            <p className="admin-board-note">
              Hiển thị {paginatedArticles.length} / {articles.length} bài. Trang {articlePage} / {articlePageCount}.
            </p>
            <div className="admin-article-list">
              {paginatedArticles.length ? paginatedArticles.map((item) => (
                <article key={item.slug} className={item.slug === article.slug ? "admin-article-row active" : "admin-article-row"}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>/{item.slug}</p>
                    <div className="admin-row-meta">
                      <span className={`admin-status ${item.status === "published" ? "published" : item.status === "archived" ? "archived" : "draft"}`}>{statusLabel(item.status)}</span>
                      {item.category ? <span>{item.category.name}</span> : null}
                      <span className={`admin-seo-mini ${seoTone(item.seoScore)}`}>SEO {item.seoScore || 0}</span>
                      <span>{readableDate(item.publishedAt || item.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="admin-row-actions">
                    <Link href={adminContentHref({ articleModal: "edit", edit: item.slug, articlePage })} className="btn btn-ghost btn-small" prefetch={false}>Sửa</Link>
                    <Link href={`/admin/preview/${item.slug}`} className="btn btn-ghost btn-small" prefetch={false}>Preview</Link>
                    {item.status === "published" ? (
                      <Link href={`/kien-thuc-tu-vi/${item.slug}`} className="btn btn-ghost btn-small" prefetch={false}>Xem</Link>
                    ) : null}
                    <AdminArticleDeleteForm slug={item.slug} title={item.title} />
                  </div>
                </article>
              )) : (
                <p className="admin-empty-note">Chưa có bài viết nào trong CMS.</p>
              )}
            </div>
            {articlePageCount > 1 ? (
              <nav className="admin-article-pagination" aria-label="Phân trang bài viết">
                <Link href={adminContentHref({ articlePage: Math.max(1, articlePage - 1) })} className={articlePage <= 1 ? "disabled" : ""} aria-disabled={articlePage <= 1} prefetch={false}>
                  Trước
                </Link>
                {Array.from({ length: articlePageCount }, (_, index) => index + 1).map((page) => (
                  <Link key={page} href={adminContentHref({ articlePage: page })} className={page === articlePage ? "active" : ""} aria-current={page === articlePage ? "page" : undefined} prefetch={false}>
                    {page}
                  </Link>
                ))}
                <Link href={adminContentHref({ articlePage: Math.min(articlePageCount, articlePage + 1) })} className={articlePage >= articlePageCount ? "disabled" : ""} aria-disabled={articlePage >= articlePageCount} prefetch={false}>
                  Sau
                </Link>
              </nav>
            ) : null}
          </section>

          <section className="admin-content-support-grid">
            <section className="panel">
              <div className="admin-panel-head">
                <div>
                  <p className="eyebrow">Danh mục</p>
                  <h2>Nhóm bài viết</h2>
                </div>
              </div>
              <form action={saveArticleCategoryAction} className="admin-category-form" data-loading-message="Đang lưu danh mục..." data-loading-label="Đang lưu...">
                <label><span>Tên danh mục</span><input name="name" placeholder="Nhập môn tử vi" required data-testid="admin-category-name" /></label>
                <label><span>Slug</span><input name="slug" placeholder="nhap-mon-tu-vi" data-testid="admin-category-slug" /></label>
                <label><span>Mô tả ngắn</span><textarea name="description" rows={2} placeholder="Nhóm bài cho người mới..." data-testid="admin-category-description" /></label>
                <LoadingSubmitButton className="btn btn-ghost w-full justify-center" loadingText="Đang lưu..." data-testid="admin-category-submit">
                  <Plus size={17} /> Lưu danh mục
                </LoadingSubmitButton>
              </form>
              <div className="admin-category-list">
                {categories.map((category) => (
                  <div key={category.id}>
                    <strong>{category.name}</strong>
                    <span>/{category.slug}</span>
                  </div>
                ))}
              </div>
            </section>
          </section>

          {isArticleModalOpen ? (
            <div className="admin-article-modal" role="dialog" aria-modal="true" aria-labelledby="admin-article-modal-title">
              <Link href={closeArticleModalHref} className="admin-article-modal-backdrop" aria-label="Đóng trình soạn bài viết" prefetch={false} />
              <section className="panel admin-editor-panel admin-article-modal-card">
                <div className="admin-panel-head admin-modal-head">
                  <div>
                    <p className="eyebrow">CMS bài viết</p>
                    <h2 id="admin-article-modal-title">{editingArticle ? "Sửa bài SEO" : "Tạo bài SEO mới"}</h2>
                  </div>
                  <div className="admin-modal-actions">
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
                    <Link href={closeArticleModalHref} className="btn btn-ghost btn-small" prefetch={false} aria-label="Đóng">
                      <X size={17} /> Đóng
                    </Link>
                  </div>
                </div>

                <div className="admin-modal-body-grid">
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

                    <label>
                      <span>Danh mục</span>
                      <select name="categoryId" defaultValue={article.categoryId || ""} data-testid="admin-article-category">
                        <option value="">Chưa chọn danh mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>

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

                    <fieldset className="admin-faq-editor">
                      <legend>FAQ trong bài viết</legend>
                      <p>Chỉ những cặp câu hỏi và câu trả lời đầy đủ mới hiện ngoài public và sinh FAQ schema.</p>
                      {faqRows.map((faq, index) => (
                        <div key={index} className="admin-faq-row">
                          <label><span>Câu hỏi {index + 1}</span><input name="faqQuestion[]" defaultValue={faq.question} data-testid={`admin-faq-question-${index}`} /></label>
                          <label><span>Câu trả lời {index + 1}</span><textarea name="faqAnswer[]" rows={2} defaultValue={faq.answer} data-testid={`admin-faq-answer-${index}`} /></label>
                        </div>
                      ))}
                    </fieldset>

                    <div className="admin-submit-row">
                      <LoadingSubmitButton className="btn btn-primary" loadingText="Đang lưu..." data-testid="admin-article-submit">
                        <FilePenLine size={18} /> Lưu bài và chấm SEO
                      </LoadingSubmitButton>
                      <span>Chỉ trạng thái “Xuất bản” hiện ngoài public. Nháp và Lưu trữ chỉ xem được trong admin preview.</span>
                    </div>
                  </form>

                  <aside className="admin-modal-side">
                    <section>
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

                    <section>
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
                  </aside>
                </div>
              </section>
            </div>
          ) : null}
        </div> : null}

        {activeTab === "pricing" ? <section className="panel admin-pricing-panel admin-tab-section">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Giá tính năng</p>
              <h2>Xu cần dùng cho từng loại luận giải</h2>
            </div>
          </div>
          <form action={saveFeaturePricesAction} className="admin-pricing-form" data-testid="admin-pricing-form" data-loading-message="Đang lưu bảng giá..." data-loading-label="Đang lưu...">
            <div className="admin-pricing-grid">
            {Object.entries(overview.featurePrices).map(([key, value]) => (
              <label key={key} className="admin-pricing-row">
                <span>{value.label}</span>
                <input
                  className="admin-pricing-input"
                  name={`priceCoins:${key}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="999999"
                  step="1"
                  defaultValue={value.priceCoins}
                  aria-label={`Giá xu cho ${value.label}`}
                  required
                />
              </label>
            ))}
            </div>
            <div className="admin-pricing-actions">
              <p>Giá này dùng chung cho nút mở luận giải, paywall và số xu bị trừ khi người dùng xác nhận.</p>
              <LoadingSubmitButton className="btn btn-primary" loadingText="Đang lưu...">
                Lưu bảng giá
              </LoadingSubmitButton>
            </div>
          </form>
        </section> : null}
      </div>
    </main>
  );
}
