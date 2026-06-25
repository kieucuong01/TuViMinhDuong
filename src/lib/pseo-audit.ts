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

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
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
  if (!page.metaTitle.trim() || !page.metaDescription.trim() || !page.canonicalUrl.startsWith("/tra-cuu/")) {
    findings.push({ severity: "error", code: "missing-metadata", slug: page.slug, message: "Thiếu metadata hoặc canonical hợp lệ." });
  }
  if (internalLinkCount < 5 || !page.body.includes("/#lap-la-so")) {
    findings.push({ severity: "error", code: "missing-internal-links", slug: page.slug, message: "Thiếu internal links hoặc CTA lập lá số." });
  }
  return findings;
}

export function auditPseoInventory(pages: PseoPageDraft[]) {
  const findings = pages.flatMap(auditPseoPage);
  const slugs = new Set<string>();
  const canonicals = new Set<string>();
  for (const page of pages) {
    if (slugs.has(page.slug)) findings.push({ severity: "error", code: "duplicate-slug", slug: page.slug, message: "Slug bị trùng." });
    if (canonicals.has(page.canonicalUrl)) findings.push({ severity: "error", code: "duplicate-canonical", slug: page.slug, message: "Canonical bị trùng." });
    slugs.add(page.slug);
    canonicals.add(page.canonicalUrl);
  }
  return findings;
}
