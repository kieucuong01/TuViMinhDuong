import type { SessionUser } from "@/lib/auth";
import type { TuViChart } from "@/lib/chart";
import type { AssistantHistoryItem } from "@/lib/chart-assistant";
import { getDb } from "@/lib/db";

const historySelect = {
  id: true,
  slot: true,
  question: true,
  answer: true,
  model: true,
} as const;

export async function getOwnedAssistantChart(user: SessionUser, chartId: string): Promise<TuViChart | null> {
  const db = getDb();
  if (!db) return null;
  const record = await db.chart.findFirst({
    where: { id: chartId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    select: { chart: true },
  });
  return record?.chart ? (record.chart as TuViChart) : null;
}

export async function getCompletedAssistantReading(user: SessionUser, chartId: string) {
  const db = getDb();
  if (!db) return null;
  return db.reading.findFirst({
    where: {
      ...(user.role === "ADMIN" ? {} : { userId: user.id }),
      chartId,
      type: "FULL",
      scopeKey: "all",
      status: "COMPLETED",
    },
    select: { id: true, content: true },
  });
}

export async function listAssistantQuestions(userId: string, chartId: string): Promise<AssistantHistoryItem[]> {
  const db = getDb();
  if (!db) return [];
  return db.assistantQuestion.findMany({
    where: { userId, chartId },
    orderBy: { slot: "asc" },
    select: historySelect,
  });
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function reserveAssistantQuestionSlot(
  userId: string,
  chartId: string,
  readingId: string,
  question: string,
) {
  const db = getDb();
  if (!db) return null;
  const occupied = await db.assistantQuestion.findMany({
    where: { userId, chartId },
    select: { slot: true },
  });
  const occupiedSlots = new Set(occupied.map((item) => item.slot));

  for (const slot of [1, 2, 3]) {
    if (occupiedSlots.has(slot)) continue;
    try {
      return await db.assistantQuestion.create({
        data: { userId, chartId, readingId, slot, question },
        select: { id: true, slot: true, question: true },
      });
    } catch (error) {
      if (isUniqueConflict(error)) continue;
      throw error;
    }
  }

  return null;
}

export async function completeAssistantQuestion(
  reservation: { id: string; slot: number; question: string },
  answer: string,
  model: string,
): Promise<AssistantHistoryItem> {
  const db = getDb();
  if (!db) {
    return { ...reservation, answer, model };
  }
  return db.assistantQuestion.update({
    where: { id: reservation.id },
    data: { answer, model },
    select: historySelect,
  });
}
