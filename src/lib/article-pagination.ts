import type { ArticleView } from "@/lib/content";

export const KNOWLEDGE_PAGE_SIZE = 6;

type CategorizedArticle = {
  category?: { slug: string } | null;
};

type PaginationOptions = {
  category?: string;
  page?: string | number;
  pageSize?: number;
};

export type KnowledgeArticleListItem = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  coverAlt?: string | null;
  category?: { name: string; slug: string } | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

function normalizeRequestedPage(page?: string | number) {
  const parsed = typeof page === "number" ? page : Number.parseInt(page || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function paginateArticles<T extends CategorizedArticle>(articles: T[], options: PaginationOptions = {}) {
  const pageSize = Math.max(1, Math.floor(options.pageSize || KNOWLEDGE_PAGE_SIZE));
  const filteredArticles = options.category
    ? articles.filter((article) => article.category?.slug === options.category)
    : articles;
  const totalItems = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(normalizeRequestedPage(options.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filteredArticles.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export function toKnowledgeArticleListItem(article: ArticleView): KnowledgeArticleListItem {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    coverAlt: article.coverAlt,
    category: article.category
      ? {
          name: article.category.name,
          slug: article.category.slug,
        }
      : null,
    publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
    updatedAt: article.updatedAt ? new Date(article.updatedAt).toISOString() : null,
  };
}
