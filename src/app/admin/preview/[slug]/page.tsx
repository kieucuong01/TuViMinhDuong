import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import { getCurrentUser } from "@/lib/auth";
import { getAdminArticleBySlug } from "@/lib/data";

export const metadata: Metadata = {
  title: "Preview bài viết",
  robots: { index: false, follow: false },
};

export default async function AdminArticlePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dang-nhap?next=/admin");

  const { slug } = await params;
  const article = await getAdminArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className="section">
      <div className="admin-preview-banner mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          <p className="eyebrow">Admin preview</p>
          <strong>{article.status === "published" ? "Bài đã xuất bản" : article.status === "archived" ? "Bài đang lưu trữ" : "Bản nháp chưa public"}</strong>
        </div>
        <div>
          <Link href={`/admin?edit=${article.slug}`} className="btn btn-ghost btn-small" prefetch={false}>Sửa bài</Link>
          {article.status === "published" ? <Link href={`/kien-thuc-tu-vi/${article.slug}`} className="btn btn-primary btn-small" prefetch={false}>Xem public</Link> : null}
        </div>
      </div>

      <article className="article-shell mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/admin">Admin</Link>
          <span>/</span>
          <Link href={`/admin?edit=${article.slug}`}>CMS</Link>
        </nav>
        <p className="eyebrow">Kiến thức tử vi</p>
        <h1 className="text-balance text-4xl font-black leading-tight text-stone-950 sm:text-5xl">{article.title}</h1>
        <p className="mt-4 text-pretty text-lg leading-8 text-stone-700">{article.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {article.category ? <span className="tag tag-soft">{article.category.name}</span> : null}
          <span className={`admin-status ${article.status === "published" ? "published" : article.status === "archived" ? "archived" : "draft"}`}>
            {article.status === "published" ? "Xuất bản" : article.status === "archived" ? "Lưu trữ" : "Nháp"}
          </span>
          {article.publishedAt ? <span className="tag tag-soft">Cập nhật {new Date(article.publishedAt).toLocaleDateString("vi-VN")}</span> : null}
        </div>
        {article.coverImage ? (
          <figure className="article-cover">
            <Image
              src={article.coverImage}
              alt={article.coverAlt || article.title}
              width={1200}
              height={675}
              priority
              sizes="(min-width: 768px) 768px, 100vw"
            />
            {article.coverAlt ? <figcaption>{article.coverAlt}</figcaption> : null}
          </figure>
        ) : null}
        <MarkdownContent content={article.content} />
      </article>
    </main>
  );
}
