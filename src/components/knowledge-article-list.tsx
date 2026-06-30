"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { KnowledgeArticleListItem } from "@/lib/article-pagination";

const ARTICLE_AUTHOR = "Admin";
const articleDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

type KnowledgeArticleListProps = {
  initialArticles: KnowledgeArticleListItem[];
  category?: string;
  page: number;
  pageSize: number;
  totalPages: number;
};

type KnowledgeArticlesResponse = {
  items: KnowledgeArticleListItem[];
  page: number;
  totalPages: number;
};

function formatArticleDate(article: KnowledgeArticleListItem) {
  const value = article.publishedAt || article.updatedAt;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString(),
    label: articleDateFormatter.format(date),
  };
}

export function buildKnowledgePageHref(page: number, category?: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/kien-thuc-tu-vi?${query}` : "/kien-thuc-tu-vi";
}

function KnowledgeArticleCard({ article }: { article: KnowledgeArticleListItem }) {
  const articleDate = formatArticleDate(article);

  return (
    <Link href={`/kien-thuc-tu-vi/${article.slug}`} className="article-card">
      {article.coverImage ? (
        <span className="article-thumb image">
          <Image
            src={article.coverImage}
            alt={article.coverAlt || article.title}
            width={600}
            height={338}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        </span>
      ) : null}
      {article.category ? <span className="article-category-label">{article.category.name}</span> : null}
      <h2>{article.title}</h2>
      <span className="article-card-meta">
        {articleDate ? <time dateTime={articleDate.iso}>{articleDate.label}</time> : null}
        <span>Người đăng: {ARTICLE_AUTHOR}</span>
      </span>
      <p>{article.excerpt}</p>
    </Link>
  );
}

export function KnowledgeArticleList({
  initialArticles,
  category,
  page,
  pageSize,
  totalPages,
}: KnowledgeArticleListProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentTotalPages, setCurrentTotalPages] = useState(totalPages);
  const [nextPage, setNextPage] = useState(page + 1);
  const [hasMore, setHasMore] = useState(page < totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"replace" | "append" | null>(null);
  const [loadError, setLoadError] = useState(false);
  const regionRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const scrollKnowledgeListIntoView = useCallback(() => {
    const region = regionRef.current;
    if (!region) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    region.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    region.focus({ preventScroll: true });
  }, []);

  const loadPage = useCallback(
    async (targetPage: number, mode: "replace" | "append", updateHistory = false) => {
      if (isLoading) return;
      setIsLoading(true);
      setLoadingMode(mode);
      setLoadError(false);

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          pageSize: String(pageSize),
        });
        if (category) params.set("category", category);
        const response = await fetch(`/api/knowledge-articles?${params.toString()}`, {
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("Không thể tải bài viết.");
        const payload = (await response.json()) as KnowledgeArticlesResponse;

        if (mode === "replace") {
          setArticles(payload.items);
          setCurrentPage(payload.page);
          setNextPage(payload.page + 1);
          setCurrentTotalPages(payload.totalPages);
          setHasMore(payload.page < payload.totalPages);
          if (updateHistory) {
            window.history.pushState(
              { knowledgePage: payload.page },
              "",
              buildKnowledgePageHref(payload.page, category),
            );
          }
          requestAnimationFrame(scrollKnowledgeListIntoView);
        } else {
          setArticles((current) => {
            const existingSlugs = new Set(current.map((article) => article.slug));
            return [...current, ...payload.items.filter((article) => !existingSlugs.has(article.slug))];
          });
          setNextPage(payload.page + 1);
          setCurrentTotalPages(payload.totalPages);
          setHasMore(payload.page < payload.totalPages);
        }
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
        setLoadingMode(null);
      }
    },
    [category, isLoading, pageSize, scrollKnowledgeListIntoView],
  );

  const loadMore = useCallback(() => {
    if (!hasMore) return Promise.resolve();
    return loadPage(nextPage, "append");
  }, [hasMore, loadPage, nextPage]);

  function handleDesktopPageClick(event: ReactMouseEvent<HTMLAnchorElement>, targetPage: number) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      isLoading ||
      targetPage === currentPage
    ) {
      return;
    }
    event.preventDefault();
    void loadPage(targetPage, "replace", true);
  }

  useEffect(() => {
    function restoreHistoryPage() {
      const params = new URLSearchParams(window.location.search);
      const requestedPage = Math.max(1, Number(params.get("page") || 1) || 1);
      if (requestedPage !== currentPage) {
        void loadPage(requestedPage, "replace");
      }
    }

    window.addEventListener("popstate", restoreHistoryPage);
    return () => window.removeEventListener("popstate", restoreHistoryPage);
  }, [currentPage, loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMore();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <section
      ref={regionRef}
      className="knowledge-article-region"
      tabIndex={-1}
      aria-busy={isLoading}
      aria-label="Danh sách bài viết"
    >
      <div className="knowledge-article-grid">
        {articles.map((article) => (
          <KnowledgeArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {currentTotalPages > 1 ? (
        <nav className="knowledge-desktop-pagination" aria-label="Phân trang bài viết">
          <Link
            href={buildKnowledgePageHref(Math.max(1, currentPage - 1), category)}
            className={currentPage <= 1 ? "disabled" : ""}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            prefetch={false}
            onClick={(event) => handleDesktopPageClick(event, Math.max(1, currentPage - 1))}
          >
            Trang trước
          </Link>
          <span>
            Trang {currentPage}/{currentTotalPages}
          </span>
          <Link
            href={buildKnowledgePageHref(Math.min(currentTotalPages, currentPage + 1), category)}
            className={currentPage >= currentTotalPages ? "disabled" : ""}
            aria-disabled={currentPage >= currentTotalPages}
            tabIndex={currentPage >= currentTotalPages ? -1 : undefined}
            prefetch={false}
            onClick={(event) => handleDesktopPageClick(event, Math.min(currentTotalPages, currentPage + 1))}
          >
            Trang sau
          </Link>
        </nav>
      ) : null}

      <div className="knowledge-desktop-pagination-status" aria-live="polite">
        {isLoading && loadingMode === "replace" ? "Đang tải trang bài viết..." : null}
      </div>

      <div ref={sentinelRef} className="knowledge-mobile-load-more" aria-live="polite">
        {isLoading && loadingMode === "append" ? <span>Đang tải thêm bài viết...</span> : null}
        {loadError ? (
          <button type="button" className="btn btn-ghost" onClick={() => void loadMore()}>
            Thử tải lại
          </button>
        ) : null}
        {!hasMore && articles.length > 0 ? <span>Bạn đã xem hết bài viết.</span> : null}
      </div>
    </section>
  );
}
