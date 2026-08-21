import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.ts";

type RegistryPrompt = { id: string; intent: string; prompt: string; targetUrl: string };
type Registry = { version: number; updatedAt: string; reviewInstruction: string; prompts: RegistryPrompt[] };

type FunnelRow = { source: string; _count: { _all: number } };
type DiscoveryRow = { source: string; aiPlatform: string | null; _count: { _all: number } };
type PromptRow = { aiPlatform: string | null; prompt: string | null; createdAt: Date };

function positiveIntArg(name: string, fallback: number, max: number) {
  const raw = process.argv.find((item) => item.startsWith(`--${name}=`))?.split("=")[1];
  const value = Number(raw || fallback);
  return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
}

function cleanCell(value: string) {
  return value.replace(/[|\n\r]+/g, " ").replace(/\s+/g, " ").trim();
}

function markdownTable(headers: string[], rows: string[][]) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cleanCell).join(" | ")} |`),
  ].join("\n");
}

export function buildAiSearchReport({
  now,
  days,
  registry,
  funnelRows,
  discoveryRows,
  promptRows,
}: {
  now: Date;
  days: number;
  registry: Registry;
  funnelRows: FunnelRow[];
  discoveryRows: DiscoveryRow[];
  promptRows: PromptRow[];
}) {
  const totalResults = funnelRows.reduce((sum, row) => sum + row._count._all, 0);
  const aiResults = funnelRows.find((row) => row.source === "ai")?._count._all || 0;
  const aiShare = totalResults ? `${((aiResults / totalResults) * 100).toFixed(1)}%` : "n/a";
  const weekSlot = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const reviewPrompts = Array.from({ length: Math.min(6, registry.prompts.length) }, (_, index) => registry.prompts[(weekSlot * 6 + index) % registry.prompts.length]);
  const topPrompts = promptRows.slice(0, 10);

  const lines = [
    `# @ls AI Search report — ${now.toISOString().slice(0, 10)}`,
    "",
    `Khoảng dữ liệu: ${days} ngày gần nhất. Report dùng chart attribution và phản hồi opt-in; không tự scrape hay giả lập câu trả lời từ ChatGPT/Gemini/Claude/Perplexity.`,
    "",
    "## Funnel thực tế",
    "",
    markdownTable(["Nguồn", "Lá số tạo"], funnelRows.map((row) => [row.source, String(row._count._all)])),
    "",
    `**AI:** ${aiResults}/${totalResults} lá số tạo (${aiShare}).`,
    "",
    "## Phản hồi discovery opt-in",
    "",
    discoveryRows.length
      ? markdownTable(["Nguồn", "Nền tảng AI", "Phản hồi"], discoveryRows.map((row) => [row.source, row.aiPlatform || "—", String(row._count._all)]))
      : "Chưa có phản hồi survey trong kỳ; đây là bình thường trong tuần đầu sau khi triển khai.",
    "",
    "## Prompt AI người dùng tự nguyện cung cấp",
    "",
    topPrompts.length
      ? markdownTable(["AI", "Prompt", "Ngày"], topPrompts.map((row) => [row.aiPlatform || "AI khác", row.prompt || "", row.createdAt.toISOString().slice(0, 10)]))
      : "Chưa có prompt opt-in trong kỳ.",
    "",
    "## 6 prompt cần kiểm thủ công tuần này",
    "",
    markdownTable(["ID", "Intent", "Prompt", "URL @ls cần thắng"], reviewPrompts.map((item) => [item.id, item.intent, item.prompt, item.targetUrl])),
    "",
    "## Cách review",
    "",
    registry.reviewInstruction,
    "",
    `Registry đầy đủ: ${registry.prompts.length} prompts, cập nhật ${registry.updatedAt}.`,
  ];
  return lines.join("\n");
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl || databaseUrl.includes("johndoe:randompassword")) throw new Error("DATABASE_URL chưa được cấu hình.");

const days = positiveIntArg("days", 14, 90);
const now = new Date();
const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const registryPath = path.resolve(process.cwd(), "config/ai-visibility-prompts.json");
const outputPath = process.env.AI_SEARCH_REPORT_OUTPUT || "/opt/lasotinhhoa/var/seo/ai-search-latest.md";
const registry = JSON.parse(await readFile(registryPath, "utf8")) as Registry;
if (!Array.isArray(registry.prompts) || registry.prompts.length < 20) throw new Error("AI prompt registry không hợp lệ.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
try {
  const [funnelRows, discoveryRows, promptRows] = await Promise.all([
    prisma.funnelEvent.groupBy({
      by: ["source"],
      where: { name: "result", createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    }),
    prisma.aiDiscoveryResponse.groupBy({
      by: ["source", "aiPlatform"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    }),
    prisma.aiDiscoveryResponse.findMany({
      where: { source: "ai", prompt: { not: null }, createdAt: { gte: since } },
      select: { aiPlatform: true, prompt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const report = buildAiSearchReport({ now, days, registry, funnelRows, discoveryRows, promptRows });
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${report}\n`, "utf8");
  console.log(`${report}\n\nSaved: ${outputPath}`);
} finally {
  await prisma.$disconnect();
}
