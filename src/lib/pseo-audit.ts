import type { PseoPageDraft } from "./pseo-registry.ts";

export type PseoAuditFinding = {
  severity: "error" | "warning";
  code: string;
  slug: string;
  message: string;
};

const UNSAFE_PATTERNS = [
  /chắc chắn (?:giàu|nghèo|thành công|thất bại)/i,
  /cam kết (?:giàu|khỏi bệnh|thành công)/i,
  /sẽ phá sản/i,
  /chắc chắn mắc bệnh/i,
];

const FABRICATED_ANECDOTE_PATTERNS = [
  /một người bạn của tôi/i,
  /một người bạn (?:thân|khác)(?: của tôi)?/i,
  /một khách hàng của tôi/i,
  /anh [A-ZĐ]\.(?:,|\s)/iu,
  /trường hợp (?:điển hình|thực tế)(?: là|:)/i,
];

const OVER_SPECIFIC_ADVICE_PATTERNS = [
  /\d+\s*%\s*(?:thu nhập|giá trị (?:nhà|tài sản)|danh mục|vốn)/i,
  /(?:nên|phải|chỉ)\s+(?:vay|dành|đầu tư|phân bổ)[^.]{0,80}\d+\s*%/i,
];

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function shingles(value: string, size = 7) {
  const tokens = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
  const result = new Set<string>();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

function normalizeSerpFormula(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[“”"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/tra cuu\s+[\p{L}\s]{2,48}\s+(?:tai|o)\s+cung\s+[\p{L}\s]{2,48}(?=\s*[:.,])/gu, "tra cuu STAR tai cung PALACE")
    .replace(/(?:sao\s+)?[\p{L}\s]{2,48}\s+cung\s+[\p{L}\s]{2,48}(?=\s*[:|–-])/gu, "STAR cung PALACE")
    .replace(/\b[\p{L}\s]{2,48}\s+(?:tai|o)\s+cung\s+[\p{L}\s]{2,48}(?=\s*[:.,])/gu, "STAR tai cung PALACE");
}

export function contentSimilarityScore(first: string, second: string) {
  const firstSet = shingles(first);
  const secondSet = shingles(second);
  if (firstSet.size === 0 && secondSet.size === 0) return 1;
  let intersection = 0;
  for (const item of firstSet) {
    if (secondSet.has(item)) intersection += 1;
  }
  const union = new Set([...firstSet, ...secondSet]).size;
  return union === 0 ? 0 : intersection / union;
}

export function auditPseoPage(page: PseoPageDraft): PseoAuditFinding[] {
  const findings: PseoAuditFinding[] = [];
  const h2Count = (page.body.match(/^##\s+/gm) || []).length;
  const tableCount = (page.body.match(/^\|.+\|$/gm) || []).length >= 4 ? 1 : 0;
  const listCount = (page.body.match(/^-\s+/gm) || []).length >= 3 ? 1 : 0;
  const internalLinkCount = (page.body.match(/\]\(\/[^)]+\)/g) || []).length;
  const bodyWords = words(page.body);

  if (bodyWords < 800 || page.body.length < 4500 || h2Count < 5 || tableCount + listCount < 2) {
    findings.push({ severity: "error", code: "thin-content", slug: page.slug, message: "Nội dung chưa đạt độ sâu hoặc cấu trúc tối thiểu." });
  }
  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(page.body))) {
    findings.push({ severity: "error", code: "unsafe-claim", slug: page.slug, message: "Nội dung chứa khẳng định tuyệt đối không an toàn." });
  }
  if (/^#\s+/m.test(page.body)) {
    findings.push({ severity: "error", code: "invalid-content-shape", slug: page.slug, message: "Thân bài không được chứa H1 lặp lại tiêu đề trang." });
  }
  if (FABRICATED_ANECDOTE_PATTERNS.some((pattern) => pattern.test(page.body))) {
    findings.push({ severity: "error", code: "fabricated-anecdote", slug: page.slug, message: "Nội dung không được trình bày ví dụ giả lập như trải nghiệm có thật." });
  }
  if (OVER_SPECIFIC_ADVICE_PATTERNS.some((pattern) => pattern.test(page.body))) {
    findings.push({ severity: "error", code: "over-specific-advice", slug: page.slug, message: "Nội dung tra cứu không được đưa tỷ lệ tài chính cụ thể như lời khuyên cá nhân." });
  }
  if (!page.metaTitle.trim() || !page.metaDescription.trim() || !page.canonicalUrl.startsWith("/tra-cuu/")) {
    findings.push({ severity: "error", code: "missing-metadata", slug: page.slug, message: "Thiếu metadata hoặc canonical hợp lệ." });
  }
  if (internalLinkCount < 5 || !/\]\(\/#lap-la-so\)/.test(page.body)) {
    findings.push({ severity: "error", code: "missing-internal-links", slug: page.slug, message: "Thiếu internal links hoặc CTA lập lá số." });
  }
  return findings;
}

export function auditPseoInventory(pages: PseoPageDraft[]) {
  const publishedPages = pages.filter((page) => page.status === "PUBLISHED");
  const findings = publishedPages.flatMap(auditPseoPage);
  const slugs = new Set<string>();
  const canonicals = new Set<string>();
  for (const page of pages) {
    if (slugs.has(page.slug)) findings.push({ severity: "error", code: "duplicate-slug", slug: page.slug, message: "Slug bị trùng." });
    if (canonicals.has(page.canonicalUrl)) findings.push({ severity: "error", code: "duplicate-canonical", slug: page.slug, message: "Canonical bị trùng." });
    slugs.add(page.slug);
    canonicals.add(page.canonicalUrl);
  }
  for (let firstIndex = 0; firstIndex < publishedPages.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < publishedPages.length; secondIndex += 1) {
      const first = publishedPages[firstIndex];
      const second = publishedPages[secondIndex];
      const score = contentSimilarityScore(first.body, second.body);
      if (score >= 0.64) {
        findings.push({
          severity: "error",
          code: "duplicate-template",
          slug: second.slug,
          message: `Nội dung quá giống ${first.slug}; không publish trang tra cứu dạng template.`,
        });
      }
    }
  }
  const serpPatterns = new Map<string, PseoPageDraft[]>();
  for (const page of publishedPages) {
    const pattern = `${normalizeSerpFormula(page.metaTitle)} || ${normalizeSerpFormula(page.metaDescription)}`;
    serpPatterns.set(pattern, [...(serpPatterns.get(pattern) || []), page]);
  }
  for (const matches of serpPatterns.values()) {
    if (matches.length < 2) continue;
    const [first, ...duplicates] = matches;
    for (const page of duplicates) {
      findings.push({
        severity: "error",
        code: "repeated-serp-pattern",
        slug: page.slug,
        message: `Title/meta qua giong ${first.slug}; can viet theo intent rieng de tranh Google gom ket qua.`,
      });
    }
  }
  return findings;
}
