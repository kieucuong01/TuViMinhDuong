import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

function articleForm(slug: string, status: "draft" | "published" | "archived") {
  const form = new FormData();
  form.set("title", status === "draft" ? "Bai nhap CMS" : "Bai xuat ban CMS");
  form.set("slug", slug);
  form.set("excerpt", "Huong dan doc la so tu vi de hieu cho nguoi moi.");
  form.set("focusKeyword", "cms tu vi");
  form.set("metaTitle", "CMS tu vi cho admin");
  form.set("metaDescription", "Quan tri bai viet tu vi voi draft, publish va SEO score.");
  form.set("canonicalUrl", `/kien-thuc-tu-vi/${slug}`);
  form.set("coverImage", "/articles/la-so-12-cung.svg");
  form.set("coverAlt", "Minh hoa la so tu vi");
  form.set("content", "## Noi dung\n\nBai viet co lien ket ve [lap la so](/#lap-la-so).");
  form.set("status", status);
  return form;
}

describe("admin article CMS", () => {
  it("keeps draft articles visible to admins but hidden from public article readers", async () => {
    const { getArticleBySlug, listAdminArticles, saveArticleFromForm } = await import("@/lib/data");
    const slug = `cms-draft-${Date.now()}`;

    const saved = await saveArticleFromForm(articleForm(slug, "draft"));

    expect(saved.status).toBe("draft");
    await expect(getArticleBySlug(slug)).resolves.toBeNull();
    await expect(listAdminArticles()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ slug, status: "draft" })]));
  });

  it("publishes articles into the public list when status is published", async () => {
    const { listArticles, saveArticleFromForm } = await import("@/lib/data");
    const slug = `cms-published-${Date.now()}`;

    const saved = await saveArticleFromForm(articleForm(slug, "published"));
    const publicArticles = await listArticles();

    expect(saved.status).toBe("published");
    expect(publicArticles).toEqual(expect.arrayContaining([expect.objectContaining({ slug, status: "published" })]));
  });

  it("keeps archived articles available to admins and hidden from public article readers", async () => {
    const { getAdminArticleBySlug, getArticleBySlug, listAdminArticles, listArticles, saveArticleFromForm } = await import("@/lib/data");
    const slug = `cms-archived-${Date.now()}`;

    const saved = await saveArticleFromForm(articleForm(slug, "archived"));

    expect(saved.status).toBe("archived");
    await expect(getArticleBySlug(slug)).resolves.toBeNull();
    await expect(getAdminArticleBySlug(slug)).resolves.toEqual(expect.objectContaining({ slug, status: "archived" }));
    await expect(listAdminArticles()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ slug, status: "archived" })]));
    await expect(listArticles()).resolves.not.toEqual(expect.arrayContaining([expect.objectContaining({ slug })]));
  });
});
