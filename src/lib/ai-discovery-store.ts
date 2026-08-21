import type { AiDiscoverySubmission } from "@/lib/ai-discovery";
import { getDb } from "@/lib/db";

type RecordAiDiscoveryResponseInput = {
  submission: AiDiscoverySubmission;
  userId?: string;
  funnelSessionId?: string;
};

export type AiDiscoveryRecordResult = "saved" | "forbidden" | "unavailable";

function chartFunnelSessionId(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const sessionId = (value as Record<string, unknown>).funnelSessionId;
  return typeof sessionId === "string" ? sessionId : undefined;
}

export async function recordAiDiscoveryResponse({
  submission,
  userId,
  funnelSessionId,
}: RecordAiDiscoveryResponseInput): Promise<AiDiscoveryRecordResult> {
  const db = getDb();
  if (!db) return "unavailable";

  const chart = await db.chart.findUnique({
    where: { id: submission.chartId },
    select: { userId: true, creationAttribution: true },
  });
  if (!chart) return "forbidden";

  const hasUserAccess = Boolean(userId && chart.userId === userId);
  const hasFunnelAccess = Boolean(
    funnelSessionId
    && chartFunnelSessionId(chart.creationAttribution) === funnelSessionId,
  );
  if (!hasUserAccess && !hasFunnelAccess) return "forbidden";

  await db.aiDiscoveryResponse.upsert({
    where: { chartId: submission.chartId },
    create: {
      chartId: submission.chartId,
      source: submission.source,
      aiPlatform: submission.aiPlatform || null,
      prompt: submission.prompt || null,
    },
    update: {},
  });
  return "saved";
}
