import { getDb } from "@/lib/db";
import {
  MAIN_STARS,
  PALACES,
  SUPPORT_STARS,
  buildPseoCombinations,
  pseoEntityPath,
  pseoEntityRouteSlug,
  type PseoEntityDefinition,
  type PseoEntityKind,
  type PseoPageDraft,
} from "@/lib/pseo-registry";
import { auditPseoPage } from "@/lib/pseo-audit";

const globalPseo = globalThis as unknown as { demoPseoPages?: Map<string, PseoPageDraft>; dbUnavailable?: boolean };

function demoPseoPages() {
  globalPseo.demoPseoPages ||= new Map(buildPseoCombinations().map((page) => [page.slug, page]));
  return globalPseo.demoPseoPages;
}

function fallbackEntities(kind?: PseoEntityKind) {
  const entities = [...MAIN_STARS, ...PALACES, ...SUPPORT_STARS];
  return kind ? entities.filter((item) => item.kind === kind) : entities;
}

export type PseoEntityPageView = {
  kind: Extract<PseoEntityKind, "MAIN_STAR" | "PALACE">;
  entity: PseoEntityDefinition;
  routeSlug: string;
  canonicalUrl: string;
  title: string;
  description: string;
  hubHref: string;
  hubLabel: string;
  relatedPages: PseoPageDraft[];
};

function jsonArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function jsonFaqs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const question = String((item as { question?: unknown }).question || "");
    const answer = String((item as { answer?: unknown }).answer || "");
    return question && answer ? [{ question, answer }] : [];
  });
}

function dbPageToView(record: Record<string, unknown>): PseoPageDraft {
  const star = record.star as { slug?: string } | null;
  const palace = record.palace as { slug?: string } | null;
  return {
    kind: String(record.kind) as PseoPageDraft["kind"],
    status: String(record.status) as PseoPageDraft["status"],
    slug: String(record.slug),
    title: String(record.title),
    excerpt: String(record.excerpt),
    body: String(record.body),
    starSlug: String(star?.slug || ""),
    palaceSlug: String(palace?.slug || ""),
    element: String(record.element || ""),
    goodPoints: jsonArray(record.goodPoints),
    cautionPoints: jsonArray(record.cautionPoints),
    scores: (record.scores || {}) as PseoPageDraft["scores"],
    faqs: jsonFaqs(record.faqs),
    focusKeyword: String(record.focusKeyword || ""),
    metaTitle: String(record.metaTitle || record.title || ""),
    metaDescription: String(record.metaDescription || record.excerpt || ""),
    canonicalUrl: String(record.canonicalUrl || `/tra-cuu/${record.slug}`),
    robots: String(record.robots || "index,follow"),
    publishedAt: record.publishedAt ? new Date(String(record.publishedAt)) : new Date(),
    updatedAt: record.updatedAt ? new Date(String(record.updatedAt)) : new Date(),
  };
}

function dbEntityToDefinition(record: Record<string, unknown>): PseoEntityDefinition {
  const kind = String(record.kind) as PseoEntityKind;
  const slug = String(record.slug);
  return {
    kind,
    slug,
    name: String(record.name),
    element: String(record.element || ""),
    summary: String(record.summary),
    strengths: jsonArray(record.strengths),
    cautions: jsonArray(record.cautions),
    canonicalPath: pseoEntityPath(kind, slug),
  };
}

export async function listPseoEntities(kind?: PseoEntityKind): Promise<PseoEntityDefinition[]> {
  const db = globalPseo.dbUnavailable ? null : getDb();
  if (!db) return fallbackEntities(kind);
  let records: Record<string, unknown>[];
  try {
    records = await (db as never as {
      pseoEntity: { findMany(args: unknown): Promise<Record<string, unknown>[]> };
    }).pseoEntity.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });
  } catch {
    globalPseo.dbUnavailable = true;
    return fallbackEntities(kind);
  }
  return records.map(dbEntityToDefinition);
}

export async function listPublishedPseoPages(): Promise<PseoPageDraft[]> {
  const db = globalPseo.dbUnavailable ? null : getDb();
  if (!db) return Array.from(demoPseoPages().values()).filter((page) => page.status === "PUBLISHED");
  let records: Record<string, unknown>[];
  try {
    records = await (db as never as {
      pseoPage: { findMany(args: unknown): Promise<Record<string, unknown>[]> };
    }).pseoPage.findMany({
      where: { status: "PUBLISHED" },
      include: { star: true, palace: true },
      orderBy: { slug: "asc" },
    });
  } catch {
    globalPseo.dbUnavailable = true;
    return Array.from(demoPseoPages().values()).filter((page) => page.status === "PUBLISHED");
  }
  return records.map(dbPageToView);
}

export async function listPublishedPseoSlugs() {
  return (await listPublishedPseoPages()).map((page) => page.slug);
}

export async function listPublishedPseoRouteSlugs() {
  const [pageSlugs, stars, palaces] = await Promise.all([
    listPublishedPseoSlugs(),
    listPseoEntities("MAIN_STAR"),
    listPseoEntities("PALACE"),
  ]);
  return [
    ...pageSlugs,
    ...stars.map((entity) => pseoEntityRouteSlug(entity.kind, entity.slug)).filter(Boolean),
    ...palaces.map((entity) => pseoEntityRouteSlug(entity.kind, entity.slug)).filter(Boolean),
  ] as string[];
}

export async function getPseoEntityPage(routeSlug: string): Promise<PseoEntityPageView | null> {
  const [stars, palaces, pages] = await Promise.all([
    listPseoEntities("MAIN_STAR"),
    listPseoEntities("PALACE"),
    listPublishedPseoPages(),
  ]);
  if (routeSlug.startsWith("sao-")) {
    const slug = routeSlug.replace(/^sao-/, "");
    const entity = stars.find((item) => item.slug === slug);
    if (!entity) return null;
    return {
      kind: "MAIN_STAR",
      entity,
      routeSlug,
      canonicalUrl: `/tra-cuu/${routeSlug}`,
      title: `Sao ${entity.name} trong tử vi`,
      description: `Tra cứu ý nghĩa sao ${entity.name}, ngũ hành, điểm mạnh, điểm cần lưu ý và 12 tổ hợp cung liên quan.`,
      hubHref: "/tra-cuu/y-nghia-14-chinh-tinh",
      hubLabel: "Ý nghĩa 14 Chính Tinh",
      relatedPages: pages.filter((page) => page.starSlug === entity.slug).slice(0, 12),
    };
  }
  if (routeSlug.startsWith("cung-")) {
    const slug = routeSlug.replace(/^cung-/, "");
    const entity = palaces.find((item) => item.slug === slug);
    if (!entity) return null;
    return {
      kind: "PALACE",
      entity,
      routeSlug,
      canonicalUrl: `/tra-cuu/${routeSlug}`,
      title: `Cung ${entity.name} trong lá số tử vi`,
      description: `Tra cứu ý nghĩa cung ${entity.name}, vai trò trong lá số và 14 tổ hợp chính tinh liên quan.`,
      hubHref: "/tra-cuu/y-nghia-12-cung",
      hubLabel: "Ý nghĩa 12 Cung",
      relatedPages: pages.filter((page) => page.palaceSlug === entity.slug).slice(0, 14),
    };
  }
  return null;
}

export async function getPublishedPseoPage(slug: string) {
  const db = globalPseo.dbUnavailable ? null : getDb();
  if (!db) {
    const page = demoPseoPages().get(slug);
    return page?.status === "PUBLISHED" ? page : null;
  }
  let record: Record<string, unknown> | null;
  try {
    record = await (db as never as {
      pseoPage: { findFirst(args: unknown): Promise<Record<string, unknown> | null> };
    }).pseoPage.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { star: true, palace: true },
    });
  } catch {
    globalPseo.dbUnavailable = true;
    const page = demoPseoPages().get(slug);
    return page?.status === "PUBLISHED" ? page : null;
  }
  return record ? dbPageToView(record) : null;
}

export async function getRelatedPseoPages(starSlug: string, palaceSlug: string) {
  const pages = await listPublishedPseoPages();
  return {
    sameStar: pages.filter((page) => page.starSlug === starSlug && page.palaceSlug !== palaceSlug).slice(0, 4),
    samePalace: pages.filter((page) => page.palaceSlug === palaceSlug && page.starSlug !== starSlug).slice(0, 4),
  };
}

export async function listAdminPseoPages() {
  const db = globalPseo.dbUnavailable ? null : getDb();
  if (!db) return Array.from(demoPseoPages().values());
  let records: Record<string, unknown>[];
  try {
    records = await (db as never as {
      pseoPage: { findMany(args: unknown): Promise<Record<string, unknown>[]> };
    }).pseoPage.findMany({
      include: { star: true, palace: true },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });
  } catch {
    globalPseo.dbUnavailable = true;
    return Array.from(demoPseoPages().values());
  }
  return records.map(dbPageToView);
}

export async function getAdminPseoPage(slug: string) {
  const db = globalPseo.dbUnavailable ? null : getDb();
  if (!db) return demoPseoPages().get(slug) || null;
  let record: Record<string, unknown> | null;
  try {
    record = await (db as never as {
      pseoPage: { findUnique(args: unknown): Promise<Record<string, unknown> | null> };
    }).pseoPage.findUnique({ where: { slug }, include: { star: true, palace: true } });
  } catch {
    globalPseo.dbUnavailable = true;
    return demoPseoPages().get(slug) || null;
  }
  return record ? dbPageToView(record) : null;
}

export async function savePseoPageFromForm(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const existing = await getAdminPseoPage(slug);
  if (!existing) throw new Error("PSEO_PAGE_NOT_FOUND");
  const requestedStatus = String(formData.get("status") || "DRAFT").toUpperCase();
  const candidate: PseoPageDraft = {
    ...existing,
    title: String(formData.get("title") || existing.title).trim(),
    excerpt: String(formData.get("excerpt") || existing.excerpt).trim(),
    body: String(formData.get("body") || existing.body).trim(),
    metaTitle: String(formData.get("metaTitle") || existing.metaTitle).trim(),
    metaDescription: String(formData.get("metaDescription") || existing.metaDescription).trim(),
    canonicalUrl: String(formData.get("canonicalUrl") || existing.canonicalUrl).trim(),
    status: requestedStatus === "PUBLISHED" ? "PUBLISHED" : requestedStatus === "ARCHIVED" ? "ARCHIVED" : "DRAFT",
    updatedAt: new Date(),
  };
  const findings = auditPseoPage(candidate);
  const hasErrors = findings.some((finding) => finding.severity === "error");
  const saved: PseoPageDraft = {
    ...candidate,
    status: candidate.status === "PUBLISHED" && hasErrors ? "DRAFT" : candidate.status,
    robots: candidate.status === "PUBLISHED" && !hasErrors ? "index,follow" : "noindex,follow",
  };
  const db = globalPseo.dbUnavailable ? null : getDb();
  if (!db) {
    demoPseoPages().set(saved.slug, saved);
    return { page: saved, findings };
  }
  const record = await (db as never as {
    pseoPage: { update(args: unknown): Promise<Record<string, unknown>> };
  }).pseoPage.update({
    where: { slug },
    data: {
      title: saved.title,
      excerpt: saved.excerpt,
      body: saved.body,
      status: saved.status,
      metaTitle: saved.metaTitle,
      metaDescription: saved.metaDescription,
      canonicalUrl: saved.canonicalUrl,
      robots: saved.robots,
      auditScore: Math.max(0, 100 - findings.filter((finding) => finding.severity === "error").length * 25),
      auditFindings: findings,
      publishedAt: saved.status === "PUBLISHED" ? saved.publishedAt || new Date() : null,
    },
    include: { star: true, palace: true },
  });
  return { page: dbPageToView(record), findings };
}
