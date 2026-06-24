"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [nextPage, setNextPage] = useState(page + 1);
  const [hasMore, setHasMore] = useState(page < totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    setLoadError(false);

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
      });
      if (category) params.set("category", category);
      const response = await fetch(`/api/knowledge-articles?${params.toString()}`);
      if (!response.ok) throw new Error("Không thể tải thêm bài viết.");
      const payload = (await response.json()) as KnowledgeArticlesResponse;

      setArticles((current) => {
        const existingSlugs = new Set(current.map((article) => article.slug));
        return [...current, ...payload.items.filter((article) => !existingSlugs.has(article.slug))];
      });
      setNextPage(payload.page + 1);
      setHasMore(payload.page < payload.totalPages);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [category, hasMore, isLoading, nextPage, pageSize]);

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
    <>
      <div className="knowledge-article-grid">
        {articles.map((article) => (
          <KnowledgeArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav className="knowledge-desktop-pagination" aria-label="Phân trang bài viết">
          <Link
            href={buildKnowledgePageHref(Math.max(1, page - 1), category)}
            className={page <= 1 ? "disabled" : ""}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
          >
            Trang trước
          </Link>
          <span>
            Trang {page}/{totalPages}
          </span>
          <Link
            href={buildKnowledgePageHref(Math.min(totalPages, page + 1), category)}
            className={page >= totalPages ? "disabled" : ""}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
          >
            Trang sau
          </Link>
        </nav>
      ) : null}

      <div ref={sentinelRef} className="knowledge-mobile-load-more" aria-live="polite">
        {isLoading ? <span>Đang tải thêm bài viết...</span> : null}
        {loadError ? (
          <button type="button" className="btn btn-ghost" onClick={() => void loadMore()}>
            Thử tải lại
          </button>
        ) : null}
        {!hasMore && articles.length > 0 ? <span>Bạn đã xem hết bài viết.</span> : null}
      </div>
    </>
  );
}
