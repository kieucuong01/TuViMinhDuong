import { rm } from "node:fs/promises";
import path from "node:path";
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

function categoryForm(name: string, slug: string) {
  const form = new FormData();
  form.set("name", name);
  form.set("slug", slug);
  form.set("description", "Nhom bai viet giup nguoi moi doc tu vi de hon.");
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

  it("keeps the original publish date when editing a published article", async () => {
    const { saveArticleFromForm } = await import("@/lib/data");
    const slug = `cms-published-edit-${Date.now()}`;

    const firstSave = await saveArticleFromForm(articleForm(slug, "published"));
    const editForm = articleForm(slug, "published");
    editForm.set("originalSlug", slug);
    editForm.set("title", "Bai xuat ban CMS da sua");
    editForm.set("excerpt", "Noi dung tom tat moi nhung ngay publish phai giu nguyen.");

    const edited = await saveArticleFromForm(editForm);

    expect(firstSave.publishedAt).toBeInstanceOf(Date);
    expect(edited.publishedAt?.toISOString()).toBe(firstSave.publishedAt?.toISOString());
  });

  it("stores uploaded article cover images under the public articles folder", async () => {
    const { saveArticleFromForm } = await import("@/lib/data");
    const slug = `cms-upload-${Date.now()}`;
    const form = articleForm(slug, "published");
    form.set("coverImageFile", new File([new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])], "cover.webp", { type: "image/webp" }));

    const saved = await saveArticleFromForm(form);
    const uploadedPath = path.join(process.cwd(), "public", saved.coverImage?.replace(/^\/+/, "") || "");

    try {
      expect(saved.coverImage).toMatch(new RegExp(`^/articles/${slug}-[a-f0-9-]+\\.webp$`));
      expect(saved.ogImage).toBe(saved.coverImage);
    } finally {
      await rm(uploadedPath, { force: true });
    }
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

  it("deletes articles from admin and public CMS lists", async () => {
    const { deleteArticleBySlug, getAdminArticleBySlug, getArticleBySlug, listAdminArticles, listArticles, saveArticleFromForm } = await import("@/lib/data");
    const slug = `cms-delete-${Date.now()}`;

    await saveArticleFromForm(articleForm(slug, "published"));
    await expect(listAdminArticles()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ slug })]));

    await expect(deleteArticleBySlug(slug)).resolves.toBe(true);

    await expect(getArticleBySlug(slug)).resolves.toBeNull();
    await expect(getAdminArticleBySlug(slug)).resolves.toBeNull();
    await expect(listAdminArticles()).resolves.not.toEqual(expect.arrayContaining([expect.objectContaining({ slug })]));
    await expect(listArticles()).resolves.not.toEqual(expect.arrayContaining([expect.objectContaining({ slug })]));
  });

  it("saves article FAQs from the editor and exposes them on public articles", async () => {
    const { getArticleBySlug, saveArticleFromForm } = await import("@/lib/data");
    const slug = `cms-faq-${Date.now()}`;
    const form = articleForm(slug, "published");
    form.set("faqQuestion[]", "Lap la so mien phi co can dang nhap khong?");
    form.set("faqAnswer[]", "Khong can dang nhap de xem ban tom tat, nhung nen dang nhap de luu lai.");
    form.append("faqQuestion[]", "FAQ trong bai viet co tao schema khong?");
    form.append("faqAnswer[]", "Co, khi cau hoi va cau tra loi duoc hien thi tren trang public.");

    await saveArticleFromForm(form);

    await expect(getArticleBySlug(slug)).resolves.toEqual(
      expect.objectContaining({
        faqs: [
          expect.objectContaining({ question: "Lap la so mien phi co can dang nhap khong?" }),
          expect.objectContaining({ answer: "Co, khi cau hoi va cau tra loi duoc hien thi tren trang public." }),
        ],
      }),
    );
  });

  it("saves article categories and attaches a selected category to an article", async () => {
    const { listArticleCategories, saveArticleCategoryFromForm, saveArticleFromForm } = await import("@/lib/data");
    const categorySlug = `nhap-mon-${Date.now()}`;
    const articleSlug = `cms-category-${Date.now()}`;

    const category = await saveArticleCategoryFromForm(categoryForm("Nhap mon tu vi", categorySlug));
    const form = articleForm(articleSlug, "published");
    form.set("categoryId", category.id);

    const saved = await saveArticleFromForm(form);

    expect(saved.categoryId).toBe(category.id);
    expect(saved.category?.slug).toBe(categorySlug);
    await expect(listArticleCategories()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ slug: categorySlug })]));
  });
});
