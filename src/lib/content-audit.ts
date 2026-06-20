import type { ArticleView } from "@/lib/content";

export type ContentAuditFinding = {
  severity: "error" | "warning";
  code: string;
  slug: string;
  message: string;
};

const MIN_CONTENT_LENGTH = 4500;
const MIN_WORD_COUNT = 800;
const MIN_INTERNAL_LINKS = 5;
const MIN_HEADINGS = 5;
const MIN_STRUCTURED_BLOCKS = 2;

function plainWordCount(content: string) {
  const text = content
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/[#>*`|_-]+/g, " ");
  return text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

function countStructuredBlocks(content: string) {
  const tableCount = content.match(/^\|.+\|\r?\n\|\s*:?-{3,}/gm)?.length ?? 0;
  const listGroups = content
    .split(/\r?\n\s*\r?\n/)
    .filter((block) => block.split(/\r?\n/).filter((line) => /^(?:-|\d+\.)\s+/.test(line)).length >= 2).length;
  return tableCount + listGroups;
}

function normalizeSection(section: string) {
  return section
    .toLocaleLowerCase("vi")
    .replace(/\[[^\]]+]\([^)]+\)/g, " link ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function articleSections(article: ArticleView) {
  return article.content
    .split(/(?=^##\s+)/gm)
    .filter((section) => !section.includes("](/#lap-la-so)"))
    .map(normalizeSection)
    .filter((section) => section.length >= 180);
}

function addDuplicateFindings(
  articles: ArticleView[],
  findings: ContentAuditFinding[],
  code: string,
  label: string,
  valueOf: (article: ArticleView) => string,
) {
  const grouped = new Map<string, ArticleView[]>();
  for (const article of articles) {
    const value = valueOf(article).trim().toLocaleLowerCase("vi");
    if (!value) continue;
    grouped.set(value, [...(grouped.get(value) || []), article]);
  }

  for (const [value, matches] of grouped) {
    if (matches.length < 2) continue;
    for (const article of matches) {
      findings.push({
        severity: "error",
        code,
        slug: article.slug,
        message: `${label} is duplicated across ${matches.length} articles: ${value}`,
      });
    }
  }
}

function containsUnsafeDeterministicClaim(content: string) {
  return content.split(/\r?\n/).some((line) => {
    const normalized = line.toLocaleLowerCase("vi");
    const claim = normalized.match(
      /(?:\b(?:bạn|ban|người này|nguoi nay)\b.{0,40})?(?:chắc chắn|chac chan)\s+(?:sẽ|se)|(?:cam kết|cam ket|đảm bảo|dam bao).{0,50}(?:kết quả|thành công|giàu|khỏi bệnh)|100%|(?:không thể|khong the)\s+thất bại|(?:\b(?:bạn|ban|người này|nguoi nay)\b.{0,40})(?:sẽ|se)\s+(?:giàu|ly hôn|mắc bệnh|mac benh)/iu,
    );
    if (!claim) return false;
    const prefix = normalized.slice(0, claim.index);
    if (/(?:không|khong|tránh|tranh|đừng|dung|không nên|khong nen|đồng nhất|dong nhat|lời hứa|loi hua)/u.test(prefix)) {
      return false;
    }
    return true;
  });
}

export function auditArticles(articles: ArticleView[]): ContentAuditFinding[] {
  const findings: ContentAuditFinding[] = [];

  addDuplicateFindings(articles, findings, "duplicate-slug", "Slug", (article) => article.slug);
  addDuplicateFindings(articles, findings, "duplicate-title", "Title", (article) => article.title);
  addDuplicateFindings(articles, findings, "duplicate-canonical", "Canonical URL", (article) => article.canonicalUrl || "");
  addDuplicateFindings(
    articles,
    findings,
    "duplicate-focus-keyword",
    "Focus keyword",
    (article) => article.focusKeyword || "",
  );

  const sectionOwners = new Map<string, string[]>();
  for (const article of articles) {
    for (const section of articleSections(article)) {
      sectionOwners.set(section, [...(sectionOwners.get(section) || []), article.slug]);
    }
  }

  for (const [section, slugs] of sectionOwners) {
    if (slugs.length < 2) continue;
    for (const slug of slugs) {
      findings.push({
        severity: "error",
        code: "repeated-section",
        slug,
        message: `A long normalized section is repeated in: ${slugs.join(", ")} (${section.slice(0, 80)}...)`,
      });
    }
  }

  for (const article of articles) {
    const internalLinks = article.content.match(/]\(\/[^)]+\)/g)?.length ?? 0;
    const headings = article.content.match(/^##\s+/gm)?.length ?? 0;
    const structuredBlocks = countStructuredBlocks(article.content);
    const wordCount = plainWordCount(article.content);

    if (article.content.length < MIN_CONTENT_LENGTH || wordCount < MIN_WORD_COUNT) {
      findings.push({
        severity: "error",
        code: "thin-content",
        slug: article.slug,
        message: `Content has ${article.content.length} characters and ${wordCount} words.`,
      });
    }
    if (!article.content.includes("](/#lap-la-so)")) {
      findings.push({
        severity: "error",
        code: "missing-conversion-cta",
        slug: article.slug,
        message: "Article does not link to /#lap-la-so.",
      });
    }
    if (internalLinks < MIN_INTERNAL_LINKS) {
      findings.push({
        severity: "error",
        code: "insufficient-internal-links",
        slug: article.slug,
        message: `Article has ${internalLinks} internal links; expected at least ${MIN_INTERNAL_LINKS}.`,
      });
    }
    if (headings < MIN_HEADINGS) {
      findings.push({
        severity: "error",
        code: "insufficient-headings",
        slug: article.slug,
        message: `Article has ${headings} H2 headings; expected at least ${MIN_HEADINGS}.`,
      });
    }
    if (structuredBlocks < MIN_STRUCTURED_BLOCKS) {
      findings.push({
        severity: "error",
        code: "insufficient-structured-blocks",
        slug: article.slug,
        message: `Article has ${structuredBlocks} structured blocks; expected at least ${MIN_STRUCTURED_BLOCKS}.`,
      });
    }
    if (containsUnsafeDeterministicClaim(article.content)) {
      findings.push({
        severity: "error",
        code: "unsafe-deterministic-claim",
        slug: article.slug,
        message: "Article contains language that may present a deterministic sensitive outcome.",
      });
    }
    if (!article.coverImage?.endsWith(".webp") || article.ogImage !== article.coverImage) {
      findings.push({
        severity: "error",
        code: "non-webp-cover",
        slug: article.slug,
        message: "Article must use one aligned local WebP cover and OG image.",
      });
    }
  }

  return findings;
}
