import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.ts";
import { loadInterpretationRules, validateInterpretationRules } from "../src/lib/interpretation-rules.ts";

const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl || databaseUrl.includes("johndoe:randompassword")) {
  throw new Error("DATABASE_URL chưa phải PostgreSQL thật.");
}

const rules = loadInterpretationRules();
const validation = validateInterpretationRules(rules);
if (!validation.ok) {
  throw new Error(`Invalid interpretation rules:\n${validation.errors.join("\n")}`);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  const activeRuleKeys = rules.map((rule) => rule.key);

  for (const rule of rules) {
    const data = {
      scope: rule.scope,
      pattern: rule.pattern as Prisma.InputJsonValue,
      priority: rule.priority,
      title: rule.title,
      summary: rule.summary,
      strengthText: rule.strengthText,
      cautionText: rule.cautionText,
      lifeAdviceText: rule.lifeAdviceText,
      teaserQuestion: rule.teaserQuestion,
      evidenceLabel: rule.evidenceLabel,
      version: rule.version,
      status: rule.status,
    };

    await prisma.interpretationRule.upsert({
      where: { key: rule.key },
      update: data,
      create: {
        key: rule.key,
        ...data,
      },
    });
  }

  const deleted = await prisma.interpretationRule.deleteMany({
    where: {
      key: {
        notIn: activeRuleKeys,
      },
    },
  });

  console.log(`Seeded ${rules.length} interpretation rules. Removed ${deleted.count} stale rules.`);
} finally {
  await prisma.$disconnect();
}
