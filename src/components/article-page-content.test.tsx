import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArticlePageContent } from "@/components/article-page-content";
import type { ArticleView } from "@/lib/content";

const article: ArticleView = {
  id: "article-ai-readable",
  title: "Cách đọc lá số rõ ràng",
  slug: "cach-doc-la-so-ro-rang",
  excerpt: "Đoạn trả lời ngắn giúp người đọc và AI agent hiểu chủ đề trước khi đọc sâu.",
  content: "## Nội dung chính\n\nBài viết giải thích theo từng bước rõ ràng.",
  status: "published",
  robots: "index,follow",
  schemaType: "Article",
  publishedAt: new Date("2026-07-20T00:00:00+07:00"),
  updatedAt: new Date("2026-07-29T00:00:00+07:00"),
};

describe("ArticlePageContent trust markup", () => {
  it("renders one extractable answer, organizational byline, and semantic update time", () => {
    const html = renderToStaticMarkup(
      createElement(ArticlePageContent, {
        article,
        articles: [article],
        sectionName: "Kiến thức tử vi",
        sectionHref: "/kien-thuc-tu-vi",
      }),
    );

    expect(html).toContain('data-answer-block="true"');
    expect(html).toContain('href="/tac-gia"');
    expect(html).toContain("Đội ngũ biên tập Lá số tinh hoa");
    expect(html).toContain("<time");
    expect(html).toContain('dateTime="2026-07-28T17:00:00.000Z"');
    expect(html.match(/<main/g)).toHaveLength(1);
  });
});
