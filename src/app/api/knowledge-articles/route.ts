import { NextResponse } from "next/server";
import { KNOWLEDGE_PAGE_SIZE, paginateArticles, toKnowledgeArticleListItem } from "@/lib/article-pagination";
import { listArticles } from "@/lib/data";

export const revalidate = 300;

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPageSize = Number.parseInt(searchParams.get("pageSize") || "", 10);
  const pageSize = Number.isInteger(requestedPageSize)
    ? Math.min(KNOWLEDGE_PAGE_SIZE, Math.max(1, requestedPageSize))
    : KNOWLEDGE_PAGE_SIZE;
  const result = paginateArticles(await listArticles(), {
    category: searchParams.get("category") || undefined,
    page: searchParams.get("page") || undefined,
    pageSize,
  });

  return NextResponse.json({
    items: result.items.map(toKnowledgeArticleListItem),
    page: result.page,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  });
}
