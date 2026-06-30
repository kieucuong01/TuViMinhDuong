import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { MAIN_STARS, PALACES, SUPPORT_STARS, buildPseoInventory } from "../src/lib/pseo-registry.ts";
import { getCuratedPseoGenerationMeta } from "../src/lib/pseo-curated.ts";

const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl || databaseUrl.includes("johndoe:randompassword")) {
  throw new Error("DATABASE_URL chưa phải PostgreSQL thật.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  for (const entity of [...MAIN_STARS, ...PALACES, ...SUPPORT_STARS]) {
    await prisma.pseoEntity.upsert({
      where: { slug: entity.slug },
      update: {
        kind: entity.kind,
        name: entity.name,
        element: entity.element,
        summary: entity.summary,
        strengths: entity.strengths,
        cautions: entity.cautions,
        canonicalPath: entity.canonicalPath,
      },
      create: {
        kind: entity.kind,
        slug: entity.slug,
        name: entity.name,
        element: entity.element,
        summary: entity.summary,
        strengths: entity.strengths,
        cautions: entity.cautions,
        canonicalPath: entity.canonicalPath,
      },
    });
  }

  const entities = await prisma.pseoEntity.findMany();
  const bySlug = new Map(entities.map((entity) => [entity.slug, entity]));
  for (const page of buildPseoInventory()) {
    const star = bySlug.get(page.starSlug);
    const palace = bySlug.get(page.palaceSlug);
    if (!star || !palace) throw new Error(`Missing entity for ${page.slug}`);
    await prisma.pseoPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        excerpt: page.excerpt,
        body: page.body,
        starId: star.id,
        palaceId: palace.id,
        element: page.element,
        goodPoints: page.goodPoints,
        cautionPoints: page.cautionPoints,
        scores: page.scores,
        faqs: page.faqs,
        focusKeyword: page.focusKeyword,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        canonicalUrl: page.canonicalUrl,
        status: page.status,
        robots: page.robots,
        auditScore: page.status === "PUBLISHED" ? 100 : 0,
        auditFindings: [],
        generationMeta: getCuratedPseoGenerationMeta(page.slug),
        publishedAt: page.status === "PUBLISHED" ? page.publishedAt : null,
      },
      create: {
        kind: "COMBINATION",
        status: page.status,
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        body: page.body,
        starId: star.id,
        palaceId: palace.id,
        element: page.element,
        goodPoints: page.goodPoints,
        cautionPoints: page.cautionPoints,
        scores: page.scores,
        faqs: page.faqs,
        focusKeyword: page.focusKeyword,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        canonicalUrl: page.canonicalUrl,
        robots: page.robots,
        auditScore: page.status === "PUBLISHED" ? 100 : 0,
        auditFindings: [],
        generationMeta: getCuratedPseoGenerationMeta(page.slug),
        publishedAt: page.status === "PUBLISHED" ? page.publishedAt : null,
      },
    });
  }
  console.log(`Seeded ${entities.length} pSEO entities and 168 unique combinations.`);
} finally {
  await prisma.$disconnect();
}
