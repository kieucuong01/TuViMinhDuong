import "server-only";

import type { TuViChart } from "@/lib/chart";
import {
  FREE_OVERVIEW_BLOCK_KEYS,
  FREE_OVERVIEW_VERSION,
  assembleFreeOverviewContent,
  buildInstantFreeOverview,
  generateFreeOverviewBlock,
  isCompleteFreeOverview,
  isCompleteFreeOverviewBlock,
  isDisplayableFreeOverview,
  splitFreeOverviewBlocks,
  type FreeOverviewBlockKey,
} from "@/lib/ai";
import { getDb } from "@/lib/db";
import { countVisibleMarkdownWords } from "@/lib/free-overview-presentation";
import { getChart } from "@/lib/data/charts";
import { charts } from "@/lib/data/demo-store";
import type {
  FreeOverviewBlockProgress,
  FreeOverviewGenerationClaim,
  FreeOverviewStatus,
} from "@/lib/data/contracts";

const FREE_OVERVIEW_PROCESSING_TTL_MS = 2 * 60 * 1000;

function storedFreeOverview(chart: TuViChart) {
  return chart.freeOverview || null;
}

function freeOverviewBlockProgress(chart: TuViChart): FreeOverviewBlockProgress[] {
  const overview = storedFreeOverview(chart);
  const blocks = overview?.version === FREE_OVERVIEW_VERSION ? overview.blocks || {} : {};
  return FREE_OVERVIEW_BLOCK_KEYS.map((key) => {
    const block = blocks[key];
    const completed = block?.status === "completed" && Boolean(block.content) && Boolean(block.model);
    return {
      key,
      status: completed ? "completed" : block?.status === "processing" ? "processing" : block?.status === "failed" ? "failed" : "idle",
      source: completed && block?.model !== "interpretation-rules-v2" ? "llm" : "seed-rules",
      ...(block?.model ? { model: block.model } : {}),
      ...(block?.generatedAt ? { generatedAt: block.generatedAt } : {}),
    };
  });
}

function completedFreeOverviewBlocks(chart: TuViChart) {
  const overview = storedFreeOverview(chart);
  if (overview?.version !== FREE_OVERVIEW_VERSION) return {} as Partial<Record<FreeOverviewBlockKey, string>>;
  return Object.fromEntries(
    FREE_OVERVIEW_BLOCK_KEYS.flatMap((key) => {
      const block = overview.blocks?.[key];
      return block?.status === "completed" && block.content && block.model ? [[key, block.content]] : [];
    }),
  ) as Partial<Record<FreeOverviewBlockKey, string>>;
}

function freeOverviewMeta(chart: TuViChart) {
  const blocks = freeOverviewBlockProgress(chart);
  const completedBlocks = blocks.filter((block) => block.status === "completed").length;
  const nextBlockKey = blocks.find((block) => block.status !== "completed")?.key;
  return { blocks, completedBlocks, totalBlocks: FREE_OVERVIEW_BLOCK_KEYS.length, ...(nextBlockKey ? { nextBlockKey } : {}) };
}

function freeOverviewFallback(
  chart: TuViChart,
  jobStatus: Extract<FreeOverviewStatus, { status: "fallback" }>["jobStatus"] = "idle",
  error?: string,
): Extract<FreeOverviewStatus, { status: "fallback" }> {
  const fallbackContent = buildInstantFreeOverview(chart);
  const content = assembleFreeOverviewContent(fallbackContent, completedFreeOverviewBlocks(chart));
  return {
    status: "fallback",
    content,
    source: "seed-rules",
    wordCount: countVisibleMarkdownWords(content),
    jobStatus,
    ...freeOverviewMeta(chart),
    ...(error ? { error } : {}),
  };
}

function cachedFreeOverviewStatus(chart: TuViChart): Extract<FreeOverviewStatus, { status: "ready" }> | null {
  const overview = storedFreeOverview(chart);
  const meta = freeOverviewMeta(chart);
  const allBlocksCompleted = meta.completedBlocks === meta.totalBlocks;
  const blockContent = allBlocksCompleted
    ? assembleFreeOverviewContent(buildInstantFreeOverview(chart), completedFreeOverviewBlocks(chart))
    : null;
  const content = blockContent || overview?.content;
  const model = blockContent
    ? Array.from(new Set(FREE_OVERVIEW_BLOCK_KEYS.map((key) => overview?.blocks?.[key]?.model).filter(Boolean))).join("+")
    : overview?.model;
  const generatedAt = blockContent
    ? FREE_OVERVIEW_BLOCK_KEYS.map((key) => overview?.blocks?.[key]?.generatedAt).filter(Boolean).sort().at(-1)
    : overview?.generatedAt;

  if (
    overview?.version !== FREE_OVERVIEW_VERSION ||
    overview.jobStatus !== "completed" && !allBlocksCompleted ||
    !content ||
    !model ||
    !generatedAt ||
    !isDisplayableFreeOverview(content)
  ) {
    return null;
  }

  const modelParts = model.split("+").filter(Boolean);
  const source = modelParts.length > 0 && modelParts.every((item) => item === "interpretation-rules-v2") ? "seed-rules" : "llm";

  return {
    status: "ready",
    content,
    source,
    model,
    generatedAt,
    wordCount: countVisibleMarkdownWords(content),
    jobStatus: "completed",
    ...meta,
  };
}

function freeOverviewJobStatus(chart: TuViChart): Extract<FreeOverviewStatus, { status: "fallback" }>["jobStatus"] {
  const overview = storedFreeOverview(chart);
  if (overview?.version !== FREE_OVERVIEW_VERSION) return "idle";
  const blocks = freeOverviewBlockProgress(chart);
  const hasRecentProcessing = blocks.some((block) => {
    if (block.status !== "processing" || !block.generatedAt) return false;
    return Date.now() - new Date(block.generatedAt).getTime() <= FREE_OVERVIEW_PROCESSING_TTL_MS;
  });
  if (hasRecentProcessing) return "processing";
  if (blocks.some((block) => block.status === "completed")) return "stale";
  if (overview.jobStatus === "failed" || blocks.some((block) => block.status === "failed")) return "failed";
  if (overview.jobStatus === "processing" && overview.generatedAt) {
    return Date.now() - new Date(overview.generatedAt).getTime() <= FREE_OVERVIEW_PROCESSING_TTL_MS ? "processing" : "stale";
  }
  return "idle";
}

export function getFreeOverviewStatus(chart: TuViChart): FreeOverviewStatus {
  const cached = cachedFreeOverviewStatus(chart);
  if (cached) return cached;

  const overview = storedFreeOverview(chart);
  return freeOverviewFallback(chart, freeOverviewJobStatus(chart), overview?.error);
}

async function updateChartFreeOverview(chartId: string, chart: TuViChart, freeOverview: NonNullable<TuViChart["freeOverview"]>) {
  const nextChart = { ...chart, freeOverview };
  const db = getDb();
  if (!db) {
    const record = charts().get(chartId);
    if (record) charts().set(chartId, { ...record, chart: nextChart });
    return nextChart;
  }

  await db.chart.update({
    where: { id: chartId },
    data: { chart: nextChart },
  });
  return nextChart;
}

async function updateChartFreeOverviewBlock(
  chartId: string,
  chart: TuViChart,
  key: FreeOverviewBlockKey,
  block: NonNullable<NonNullable<TuViChart["freeOverview"]>["blocks"]>[string],
) {
  const latestRecord = await getChart(chartId);
  const latestChart = latestRecord?.chart || chart;
  const base = latestChart.freeOverview?.version === FREE_OVERVIEW_VERSION ? latestChart.freeOverview : { version: FREE_OVERVIEW_VERSION };
  if (base.jobStatus === "completed" && base.content && base.model && isCompleteFreeOverview(base.content)) {
    return latestChart;
  }
  const existingBlock = base.blocks?.[key];
  if (existingBlock?.status === "completed" && block.status !== "completed") {
    return latestChart;
  }
  const incomingBlock = block.status === "completed" && !isCompleteFreeOverviewBlock(key, latestChart, block.content || "")
    ? { status: "failed" as const, generatedAt: block.generatedAt || new Date().toISOString(), error: "FREE_OVERVIEW_BLOCK_INVALID" }
    : block;

  const nextBlocks = { ...(base.blocks || {}), [key]: incomingBlock };
  let allCompleted = FREE_OVERVIEW_BLOCK_KEYS.every((item) => {
    const current = nextBlocks[item];
    return current?.status === "completed" && current.content && current.model;
  });

  const generatedAt = incomingBlock.generatedAt || new Date().toISOString();
  const freeOverview: NonNullable<TuViChart["freeOverview"]> = {
    version: FREE_OVERVIEW_VERSION,
    jobStatus: allCompleted ? "completed" : incomingBlock.status === "failed" ? "failed" : "processing",
    generatedAt,
    blocks: nextBlocks,
  };

  if (allCompleted) {
    const content = assembleFreeOverviewContent(
      buildInstantFreeOverview(latestChart),
      Object.fromEntries(FREE_OVERVIEW_BLOCK_KEYS.map((item) => [item, nextBlocks[item]?.content || ""])) as Partial<Record<FreeOverviewBlockKey, string>>,
    );
    if (isCompleteFreeOverview(content)) {
      freeOverview.content = content;
      freeOverview.model = Array.from(new Set(FREE_OVERVIEW_BLOCK_KEYS.map((item) => nextBlocks[item]?.model).filter(Boolean))).join("+");
    } else {
      nextBlocks[key] = {
        status: "failed",
        generatedAt,
        error: "FREE_OVERVIEW_ASSEMBLY_INVALID",
      };
      allCompleted = false;
      freeOverview.jobStatus = "failed";
      freeOverview.error = "FREE_OVERVIEW_ASSEMBLY_INVALID";
      freeOverview.blocks = nextBlocks;
    }
  }

  return updateChartFreeOverview(chartId, latestChart, freeOverview);
}

export async function claimFreeOverviewGeneration(chartId: string, chart: TuViChart): Promise<FreeOverviewGenerationClaim> {
  const status = getFreeOverviewStatus(chart);
  if (status.status === "ready" && status.source === "llm") return { status: "ready", overview: status };
  if (status.status === "fallback" && status.jobStatus === "processing") return { status: "processing", overview: status };

  await updateChartFreeOverview(chartId, chart, {
    version: FREE_OVERVIEW_VERSION,
    jobStatus: "processing",
    generatedAt: new Date().toISOString(),
  });
  return { status: "claimed" };
}

export async function claimFreeOverviewBlockGeneration(
  chartId: string,
  chart: TuViChart,
  key: FreeOverviewBlockKey,
): Promise<FreeOverviewGenerationClaim> {
  const latest = await getChart(chartId);
  const latestChart = latest?.chart || chart;
  const status = getFreeOverviewStatus(latestChart);
  if (status.status === "ready" && status.source === "llm") return { status: "ready", overview: status };
  const block = status.blocks?.find((item) => item.key === key);
  if (block?.status === "completed") return { status: "ready", overview: status as Extract<FreeOverviewStatus, { status: "ready" }> };
  if (block?.status === "processing" && block.generatedAt && Date.now() - new Date(block.generatedAt).getTime() <= FREE_OVERVIEW_PROCESSING_TTL_MS) {
    return { status: "processing", overview: status as Extract<FreeOverviewStatus, { status: "fallback" }> };
  }

  await updateChartFreeOverviewBlock(chartId, latestChart, key, {
    status: "processing",
    generatedAt: new Date().toISOString(),
  });
  return { status: "claimed" };
}

export async function failFreeOverviewGeneration(chartId: string, error: string) {
  const record = await getChart(chartId);
  if (!record) return null;
  const status = getFreeOverviewStatus(record.chart);
  if (status.status === "ready" && status.source === "llm") return status;
  const nextChart = await updateChartFreeOverview(chartId, record.chart, {
    version: FREE_OVERVIEW_VERSION,
    jobStatus: "failed",
    generatedAt: new Date().toISOString(),
    error,
    ...(record.chart.freeOverview?.version === FREE_OVERVIEW_VERSION ? { blocks: record.chart.freeOverview.blocks } : {}),
  });
  return getFreeOverviewStatus(nextChart);
}

export async function generateAndStoreFreeOverviewBlock(chartId: string, key: FreeOverviewBlockKey) {
  const record = await getChart(chartId);
  if (!record) throw new Error("Không tìm thấy lá số.");

  await updateChartFreeOverviewBlock(chartId, record.chart, key, {
    status: "processing",
    generatedAt: new Date().toISOString(),
  });

  try {
    const generated = await generateFreeOverviewBlock(record.chart, key);
    const latest = await getChart(chartId);
    const nextChart = await updateChartFreeOverviewBlock(chartId, latest?.chart || record.chart, key, {
      content: generated.content,
      model: generated.model,
      status: "completed",
      generatedAt: new Date().toISOString(),
      ...(generated.model === "interpretation-rules-v2" ? { error: "FREE_OVERVIEW_BLOCK_LLM_UNAVAILABLE_OR_INVALID" } : {}),
    });
    return getFreeOverviewStatus(nextChart);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const latest = await getChart(chartId);
    const fallbackBlock = splitFreeOverviewBlocks(buildInstantFreeOverview(latest?.chart || record.chart)).blocks[key];
    const fallbackChart = await updateChartFreeOverviewBlock(chartId, latest?.chart || record.chart, key, {
      content: fallbackBlock,
      model: "interpretation-rules-v2",
      status: "completed",
      generatedAt: new Date().toISOString(),
      error: message,
    });
    return getFreeOverviewStatus(fallbackChart);
  }
}

export async function generateAndStoreFreeOverview(chartId: string, options: { force?: boolean } = {}) {
  const record = await getChart(chartId);
  if (!record) throw new Error("Không tìm thấy lá số.");
  const status = getFreeOverviewStatus(record.chart);
  if (status.status === "ready" && status.source === "llm") return status;
  if (!options.force && status.status === "fallback" && status.jobStatus === "processing") return status;

  const nextBlockKey = status.nextBlockKey || FREE_OVERVIEW_BLOCK_KEYS[0];
  return generateAndStoreFreeOverviewBlock(chartId, nextBlockKey);
}

export async function getOrCreateFreeOverview(_chartId: string, chart: TuViChart) {
  return getFreeOverviewStatus(chart).content;
}
