import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { articleWithScore, seedArticles, type ArticleCategoryView, type ArticleView } from "@/lib/content";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/format";
import { scoreArticleSeo } from "@/lib/seo";
import { cacheServerData } from "@/lib/data/cache";
import { demoArticleCategories, demoArticles } from "@/lib/data/demo-store";
import type { ArticleSummary } from "@/lib/data/contracts";

type ArticleRecord = Omit<ArticleView, "faqs"> & {
  faqs?: unknown;
};

type ArticleSummaryRecord = ArticleSummary & {
  status: string;
  createdAt?: Date | null;
};

export const DELETED_ARTICLE_STATUS = "deleted";
export const ARTICLES_CACHE_TAG = "articles";

function articleSortValue(article: Pick<ArticleView, "updatedAt" | "publishedAt"> & { createdAt?: Date | null }) {
  return article.updatedAt?.getTime() || article.publishedAt?.getTime() || article.createdAt?.getTime() || 0;
}

function sortArticlesNewestFirst<T extends Pick<ArticleView, "updatedAt" | "publishedAt"> & { createdAt?: Date | null }>(articles: T[]) {
  return articles.sort((a, b) => articleSortValue(b) - articleSortValue(a));
}

function articleSummaryRecord(article: ArticleSummaryRecord | ArticleView): ArticleSummaryRecord {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    coverAlt: article.coverAlt,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    status: article.status,
    createdAt: "createdAt" in article ? article.createdAt : null,
  };
}

function publicArticleSummary(article: ArticleSummaryRecord): ArticleSummary {
  const { id, slug, title, excerpt, coverImage, coverAlt, publishedAt, updatedAt } = article;
  return { id, slug, title, excerpt, coverImage, coverAlt, publishedAt, updatedAt };
}

function articleStatusFromForm(formData: FormData) {
  const status = String(formData.get("status") || "published");
  return status === "draft" || status === "archived" ? status : "published";
}

function normalizeFaqs(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { question?: unknown; answer?: unknown };
      const question = String(record.question || "").trim();
      const answer = String(record.answer || "").trim();
      return question && answer ? { question, answer } : null;
    })
    .filter(Boolean) as { question: string; answer: string }[];
}

function faqsFromForm(formData: FormData) {
  const questions = formData.getAll("faqQuestion[]").map((item) => String(item || "").trim());
  const answers = formData.getAll("faqAnswer[]").map((item) => String(item || "").trim());
  return questions
    .map((question, index) => ({ question, answer: answers[index] || "" }))
    .filter((item) => item.question && item.answer)
    .slice(0, 8);
}

function hasByteSignature(bytes: Uint8Array, signatures: number[][]) {
  return signatures.some((signature) => signature.every((byte, index) => bytes[index] === byte));
}

function isFileUpload(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      typeof value.arrayBuffer === "function" &&
      "size" in value &&
      typeof value.size === "number" &&
      "type" in value &&
      typeof value.type === "string",
  );
}

function uploadExtensionForFile(file: File, bytes: Uint8Array, uploadTypes: Record<string, { extension: string; signatures: number[][] }>) {
  const uploadType = uploadTypes[file.type];
  if (!uploadType) {
    throw new Error("Chi ho tro upload anh JPEG, PNG hoac WebP.");
  }

  if (!hasByteSignature(bytes, uploadType.signatures)) {
    throw new Error("File anh khong dung dinh dang da chon.");
  }

  if (file.type === "image/webp") {
    const riffType = new TextDecoder().decode(bytes.slice(8, 12));
    if (riffType !== "WEBP") throw new Error("File anh khong dung dinh dang da chon.");
  }

  return uploadType.extension;
}

async function articleCoverImageFromForm(formData: FormData, slug: string) {
  const fallbackImage = String(formData.get("coverImage") || "").trim() || "/og-default.svg";
  const upload = formData.get("coverImageFile");
  if (!isFileUpload(upload) || upload.size === 0) return fallbackImage;

  const { ARTICLE_UPLOAD_DIR, ARTICLE_UPLOAD_MAX_BYTES, ARTICLE_UPLOAD_PUBLIC_PATH, ARTICLE_UPLOAD_TYPES } = await import("@/lib/article-upload-storage");

  if (upload.size > ARTICLE_UPLOAD_MAX_BYTES) {
    throw new Error("Anh dai dien toi da 5MB.");
  }

  const bytes = new Uint8Array(await upload.arrayBuffer());
  const extension = uploadExtensionForFile(upload, bytes, ARTICLE_UPLOAD_TYPES);
  const safeSlug = slug || `article-${Date.now()}`;
  const fileName = `${safeSlug}-${randomUUID()}.${extension}`;

  await mkdir(ARTICLE_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(ARTICLE_UPLOAD_DIR, fileName), bytes);
  return `${ARTICLE_UPLOAD_PUBLIC_PATH}/${fileName}`;
}

function articleWithNormalizedRelations(article: ArticleRecord): ArticleView {
  return articleWithScore({
    ...article,
    faqs: normalizeFaqs(article.faqs),
    category: article.category || null,
  });
}

function fresherSeedArticle(slug: string, candidateUpdatedAt?: Date | null) {
  const seed = seedArticles.find((article) => article.slug === slug);
  if (!seed) return null;

  const normalizedSeed = articleWithNormalizedRelations(seed);
  const seedUpdatedAt = normalizedSeed.updatedAt?.getTime() || normalizedSeed.publishedAt?.getTime() || 0;
  const candidateTime = candidateUpdatedAt?.getTime() || 0;

  return seedUpdatedAt > candidateTime ? normalizedSeed : null;
}

async function readArticlesFromDb() {
  const db = getDb();
  if (!db) return sortArticlesNewestFirst(Array.from(demoArticles().values()).filter((article) => article.status === "published").map(articleWithNormalizedRelations));
  let articles: ArticleRecord[] = [];
  try {
    articles = (await db.article.findMany({
      where: { status: { in: ["published", DELETED_ARTICLE_STATUS] } },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    })) as unknown as ArticleRecord[];
  } catch {
    return sortArticlesNewestFirst(seedArticles.map(articleWithNormalizedRelations));
  }
  const bySlug = new Map(seedArticles.map((article) => [article.slug, articleWithNormalizedRelations(article)]));
  for (const article of articles) {
    if (article.status === DELETED_ARTICLE_STATUS) {
      bySlug.delete(article.slug);
      continue;
    }
    const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
    if (fresherSeed) {
      bySlug.set(article.slug, fresherSeed);
      continue;
    }
    bySlug.set(article.slug, articleWithNormalizedRelations(article));
  }
  return sortArticlesNewestFirst(Array.from(bySlug.values()));
}

const getCachedArticlesFromDb = cacheServerData(readArticlesFromDb, [ARTICLES_CACHE_TAG, "list"], {
  tags: [ARTICLES_CACHE_TAG],
  revalidate: 300,
});

export async function listArticles() {
  if (!getDb()) return readArticlesFromDb();
  return getCachedArticlesFromDb();
}

async function readArticleSummariesFromDb(limit: number): Promise<ArticleSummary[]> {
  const db = getDb();
  if (!db) {
    return sortArticlesNewestFirst(
      Array.from(demoArticles().values())
        .filter((article) => article.status === "published")
        .map(articleSummaryRecord),
    ).slice(0, limit).map(publicArticleSummary);
  }

  let articles: ArticleSummaryRecord[];
  try {
    articles = (await db.article.findMany({
      where: { status: { in: ["published", DELETED_ARTICLE_STATUS] } },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        coverAlt: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    })) as ArticleSummaryRecord[];
  } catch {
    return sortArticlesNewestFirst(seedArticles.map(articleSummaryRecord)).slice(0, limit).map(publicArticleSummary);
  }

  const bySlug = new Map(seedArticles.map((article) => [article.slug, articleSummaryRecord(article)]));
  for (const article of articles) {
    if (article.status === DELETED_ARTICLE_STATUS) {
      bySlug.delete(article.slug);
      continue;
    }
    const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
    bySlug.set(article.slug, fresherSeed ? articleSummaryRecord(fresherSeed) : articleSummaryRecord(article));
  }

  return sortArticlesNewestFirst(Array.from(bySlug.values())).slice(0, limit).map(publicArticleSummary);
}

const getCachedArticleSummariesFromDb = cacheServerData(readArticleSummariesFromDb, [ARTICLES_CACHE_TAG, "summaries"], {
  tags: [ARTICLES_CACHE_TAG],
  revalidate: 300,
});

export async function listArticleSummaries(limit = 3): Promise<ArticleSummary[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error("Article summary limit must be an integer between 1 and 20.");
  }
  if (!getDb()) return readArticleSummariesFromDb(limit);
  return getCachedArticleSummariesFromDb(limit);
}

export async function listAdminArticles() {
  const db = getDb();
  if (!db) return sortArticlesNewestFirst(Array.from(demoArticles().values()).map(articleWithNormalizedRelations));
  try {
    const articles = (await db.article.findMany({
      include: { category: true },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    })) as unknown as ArticleRecord[];
    const bySlug = new Map(seedArticles.map((article) => [article.slug, articleWithNormalizedRelations(article)]));
    for (const article of articles) {
      if (article.status === DELETED_ARTICLE_STATUS) {
        bySlug.delete(article.slug);
        continue;
      }
      const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
      if (fresherSeed) {
        bySlug.set(article.slug, fresherSeed);
        continue;
      }
      bySlug.set(article.slug, articleWithNormalizedRelations(article));
    }
    return sortArticlesNewestFirst(Array.from(bySlug.values()));
  } catch {
    return sortArticlesNewestFirst(seedArticles.map(articleWithNormalizedRelations));
  }
}

async function readArticleBySlugFromDb(slug: string) {
  const db = getDb();
  if (!db) {
    const article = demoArticles().get(slug);
    return article?.status === "published" ? articleWithNormalizedRelations(article) : null;
  }
  try {
    const article = await db.article.findUnique({ where: { slug }, include: { category: true } });
    if (article) {
      const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
      if (fresherSeed) return fresherSeed;
      const scored = articleWithNormalizedRelations(article as unknown as ArticleRecord);
      return scored.status === "published" ? scored : null;
    }
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  } catch {
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  }
}

const getCachedArticleBySlugFromDb = cacheServerData(readArticleBySlugFromDb, [ARTICLES_CACHE_TAG, "slug"], {
  tags: [ARTICLES_CACHE_TAG],
  revalidate: 300,
});

export async function getArticleBySlug(slug: string) {
  if (!getDb()) return readArticleBySlugFromDb(slug);
  return getCachedArticleBySlugFromDb(slug);
}

export async function getAdminArticleBySlug(slug: string) {
  const db = getDb();
  if (!db) {
    const article = demoArticles().get(slug);
    return article ? articleWithNormalizedRelations(article) : null;
  }
  try {
    const article = await db.article.findUnique({ where: { slug }, include: { category: true } });
    if (article?.status === DELETED_ARTICLE_STATUS) return null;
    if (article) {
      const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
      if (fresherSeed) return fresherSeed;
      return articleWithNormalizedRelations(article as unknown as ArticleRecord);
    }
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  } catch {
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  }
}

export async function deleteArticleBySlug(slug: string) {
  const normalizedSlug = slugify(slug);
  if (!normalizedSlug) return false;

  const db = getDb();
  if (!db) {
    return demoArticles().delete(normalizedSlug);
  }

  const existing = await db.article.findUnique({ where: { slug: normalizedSlug } });
  if (existing) {
    await db.article.update({
      where: { id: existing.id },
      data: {
        status: DELETED_ARTICLE_STATUS,
        publishedAt: null,
        robots: "noindex,nofollow",
      },
    });
    return true;
  }

  const seed = seedArticles.find((article) => article.slug === normalizedSlug);
  if (!seed) return false;

  await db.article.create({
    data: {
      title: seed.title,
      slug: seed.slug,
      excerpt: seed.excerpt,
      content: seed.content,
      status: DELETED_ARTICLE_STATUS,
      coverImage: seed.coverImage,
      coverAlt: seed.coverAlt,
      focusKeyword: seed.focusKeyword,
      metaTitle: seed.metaTitle,
      metaDescription: seed.metaDescription,
      canonicalUrl: seed.canonicalUrl,
      robots: "noindex,nofollow",
      ogImage: seed.ogImage,
      ogTitle: seed.ogTitle,
      ogDescription: seed.ogDescription,
      schemaType: seed.schemaType || "Article",
      faqs: seed.faqs || [],
      seoScore: seed.seoScore || 0,
      seoChecklist: seed.seoChecklist || [],
      publishedAt: null,
    },
  });
  return true;
}

async function readArticleCategoriesFromDb() {
  const db = getDb();
  if (!db) return Array.from(demoArticleCategories().values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  try {
    return (await db.articleCategory.findMany({ orderBy: { name: "asc" } })) as ArticleCategoryView[];
  } catch {
    return Array.from(demoArticleCategories().values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }
}

const getCachedArticleCategoriesFromDb = cacheServerData(readArticleCategoriesFromDb, [ARTICLES_CACHE_TAG, "categories"], {
  tags: [ARTICLES_CACHE_TAG],
  revalidate: 300,
});

export async function listArticleCategories() {
  if (!getDb()) return readArticleCategoriesFromDb();
  return getCachedArticleCategoriesFromDb();
}

export async function saveArticleCategoryFromForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slug = slugify(String(formData.get("slug") || name));
  const description = String(formData.get("description") || "").trim();
  const originalCategoryId = String(formData.get("originalCategoryId") || "");
  const category: ArticleCategoryView = {
    id: originalCategoryId || `cat-${slug}`,
    name,
    slug,
    description,
  };

  const db = getDb();
  if (!db) {
    demoArticleCategories().set(category.id, category);
    return category;
  }

  const existing = originalCategoryId ? await db.articleCategory.findUnique({ where: { id: originalCategoryId } }) : null;
  const saved = existing
    ? await db.articleCategory.update({ where: { id: originalCategoryId }, data: { name, slug, description } })
    : await db.articleCategory.upsert({
        where: { slug },
        update: { name, description },
        create: { name, slug, description },
      });
  return saved as ArticleCategoryView;
}

export async function saveArticleFromForm(formData: FormData) {
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const excerpt = String(formData.get("excerpt") || "");
  const focusKeyword = String(formData.get("focusKeyword") || "");
  const slug = slugify(String(formData.get("slug") || title));
  const originalSlug = slugify(String(formData.get("originalSlug") || slug));
  const status = articleStatusFromForm(formData);
  const categoryId = String(formData.get("categoryId") || "") || null;
  const category = categoryId ? demoArticleCategories().get(categoryId) || null : null;
  const faqs = faqsFromForm(formData);
  const metaTitle = String(formData.get("metaTitle") || title);
  const metaDescription = String(formData.get("metaDescription") || excerpt);
  const canonicalUrl = String(formData.get("canonicalUrl") || `/kien-thuc-tu-vi/${slug}`);
  const coverImage = await articleCoverImageFromForm(formData, slug);
  const coverAlt = String(formData.get("coverAlt") || "");
  const db = getDb();
  const existingDemoArticle = !db ? demoArticles().get(originalSlug) || demoArticles().get(slug) || null : null;
  const existing = db ? await db.article.findUnique({ where: { slug: originalSlug || slug } }) : null;
  const existingPublishedAt = existing?.publishedAt || existingDemoArticle?.publishedAt || null;
  const publishedAt = existingPublishedAt || (status === "published" ? new Date() : null);
  const seo = scoreArticleSeo({
    title,
    slug,
    excerpt,
    content,
    focusKeyword,
    metaTitle,
    metaDescription,
    canonicalUrl,
    coverAlt,
    schemaType: "Article",
  });

  const article: ArticleView = {
    id: `article-${slug}`,
    categoryId,
    category,
    title,
    slug,
    excerpt,
    content,
    status,
    coverImage,
    coverAlt,
    focusKeyword,
    metaTitle,
    metaDescription,
    canonicalUrl,
    robots: "index,follow",
    ogImage: coverImage,
    schemaType: "Article",
    faqs,
    seoScore: seo.score,
    seoChecklist: seo.checks,
    publishedAt,
    updatedAt: new Date(),
  };

  if (!db) {
    if (originalSlug !== slug) demoArticles().delete(originalSlug);
    demoArticles().set(slug, article);
    return article;
  }

  const articleData = {
    categoryId,
    title,
    excerpt,
    content,
    focusKeyword,
    metaTitle,
    metaDescription,
    canonicalUrl,
    coverImage,
    coverAlt,
    ogImage: coverImage,
    status,
    faqs,
    seoScore: seo.score,
    seoChecklist: seo.checks,
    publishedAt,
  };

  const saved = existing
    ? await db.article.update({
        where: { id: existing.id },
        data: { ...articleData, slug },
        include: { category: true },
      })
    : await db.article.upsert({
        where: { slug },
        update: articleData,
        create: {
          ...articleData,
          slug,
          schemaType: "Article",
        },
        include: { category: true },
      });
  return articleWithNormalizedRelations(saved as unknown as ArticleRecord);
}
