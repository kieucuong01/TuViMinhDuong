import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { generateWithLlmRouter } from "../src/lib/llm-router.ts";
import { auditPseoPage } from "../src/lib/pseo-audit.ts";
import { buildPseoDraft } from "../src/lib/pseo-registry.ts";

const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl || databaseUrl.includes("johndoe:randompassword")) throw new Error("DATABASE_URL chưa được cấu hình.");
const limitArg = process.argv.find((item) => item.startsWith("--limit="));
const limit = Math.max(1, Math.min(168, Number(limitArg?.split("=")[1] || 168)));
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  const records = await prisma.pseoPage.findMany({
    where: { kind: "COMBINATION" },
    include: { star: true, palace: true },
    orderBy: { slug: "asc" },
    take: limit,
  });
  for (const record of records) {
    if (!record.star || !record.palace) continue;
    const base = buildPseoDraft(record.star.slug, record.palace.slug);
    let body = record.body;
    let findings = auditPseoPage({ ...base, body });
    let model = "existing";
    for (let attempt = 1; attempt <= 3 && findings.some((item) => item.severity === "error"); attempt += 1) {
      const result = await generateWithLlmRouter({
        prompt: `Viết bài tiếng Việt tối thiểu 900 từ về "${base.title}".
Giữ ít nhất 6 H2, 2 bảng Markdown, 5 internal link có sẵn trong bản nền.
Không hứa hẹn giàu có, sức khỏe, hôn nhân hoặc vận mệnh chắc chắn.
Điểm số bắt buộc giữ nguyên: ${JSON.stringify(base.scores)}.
Bản nền để giữ cấu trúc và liên kết:
${base.body}`,
        temperature: 0.45,
        maxTokens: 5000,
      });
      if (!result) break;
      body = result.text;
      model = result.model;
      findings = auditPseoPage({ ...base, body });
    }
    const publish = findings.every((item) => item.severity !== "error");
    await prisma.pseoPage.update({
      where: { id: record.id },
      data: {
        body,
        status: publish ? "PUBLISHED" : "DRAFT",
        robots: publish ? "index,follow" : "noindex,follow",
        auditScore: Math.max(0, 100 - findings.filter((item) => item.severity === "error").length * 25),
        auditFindings: findings,
        generationMeta: { source: "llm-router", model, generatedAt: new Date().toISOString() },
        publishedAt: publish ? record.publishedAt || new Date() : null,
      },
    });
    console.log(`${record.slug}: ${publish ? "published" : "draft"} (${model})`);
  }
} finally {
  await prisma.$disconnect();
}
