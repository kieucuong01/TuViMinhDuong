import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateReadingWithProgress, type PaidReadingChapterOutput } from "@/lib/ai";
import { adjustCoins, completeReadingJob, failReadingJob, getChart, getReadingJobById, updateReadingJobProgress } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const globalJobState = globalThis as unknown as {
  readingJobLocks?: Set<string>;
};

function readingJobLocks() {
  globalJobState.readingJobLocks ||= new Set();
  return globalJobState.readingJobLocks;
}

function parsePromptMeta(prompt?: string) {
  if (!prompt) return undefined;
  try {
    return JSON.parse(prompt) as unknown;
  } catch {
    return { rawPromptMeta: prompt };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function preservePaymentOrderId(meta: Record<string, unknown>, promptMeta: unknown) {
  const paymentOrderId = isRecord(promptMeta) ? promptMeta.paymentOrderId : undefined;
  return typeof paymentOrderId === "string" && paymentOrderId ? { ...meta, paymentOrderId } : meta;
}

function progressMeta(phase: "processing" | "completed", completedChapters: PaidReadingChapterOutput[], totalChapters: number) {
  return {
    phase,
    updatedAt: new Date().toISOString(),
    progress: {
      completed: completedChapters.length,
      total: totalChapters,
      chapters: completedChapters.map((chapter) => ({
        key: chapter.key,
        title: chapter.title,
        model: chapter.model,
        wordCount: chapter.wordCount,
        maxTokens: chapter.maxTokens,
        formatGuarded: chapter.formatGuarded,
      })),
    },
  };
}

type ProcessUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
type ProcessReading = NonNullable<Awaited<ReturnType<typeof getReadingJobById>>>;

async function runFullReadingJob(readingId: string, user: ProcessUser, reading: ProcessReading) {
  try {
    const record = await getChart(reading.chartId);
    if (!record) throw new Error("Không tìm thấy lá số.");

    await updateReadingJobProgress(readingId, reading.content || "", preservePaymentOrderId({
      phase: "processing",
      startedAt: new Date().toISOString(),
      progress: { completed: 0, total: 8, chapters: [] },
    }, reading.promptMeta));

    const result = await generateReadingWithProgress(record.chart, "FULL", "all", async (progress) => {
      const partialContent = progress.completedChapters.map((chapter) => chapter.content.trim()).join("\n\n");
      const model = Array.from(new Set(progress.completedChapters.map((chapter) => chapter.model))).join(" + ");
      await updateReadingJobProgress(
        readingId,
        partialContent,
        preservePaymentOrderId(progressMeta("processing", progress.completedChapters, progress.totalChapters), reading.promptMeta),
        model,
      );
    });

    const parsedPromptMeta = parsePromptMeta(result.prompt);
    const completedMeta = {
      ...(isRecord(parsedPromptMeta) ? parsedPromptMeta : { promptMeta: parsedPromptMeta }),
      phase: "completed",
      completedAt: new Date().toISOString(),
    };
    await completeReadingJob(readingId, result.content, preservePaymentOrderId(completedMeta, reading.promptMeta), result.model);
    revalidatePath(`/la-so/${reading.chartId}`);
    revalidatePath(`/la-so/${reading.chartId}/nang-cao`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được luận giải.";
    const shouldRefund = reading.priceCoins > 0 && user.role !== "ADMIN";
    if (shouldRefund) await adjustCoins(user, reading.priceCoins, "Hoàn xu do AI lỗi", `${reading.chartId}:FULL:all`);
    await failReadingJob(
      readingId,
      message,
      shouldRefund,
      preservePaymentOrderId({
        phase: "failed",
        failedAt: new Date().toISOString(),
        refunded: shouldRefund,
        error: message,
      }, reading.promptMeta),
    );
  } finally {
    readingJobLocks().delete(readingId);
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reading = await getReadingJobById(user.id, id);
  if (!reading) return NextResponse.json({ error: "Không tìm thấy luận giải." }, { status: 404 });
  if (reading.type !== "FULL" || reading.scopeKey !== "all") {
    return NextResponse.json({ error: "Job nền chỉ áp dụng cho bản luận giải toàn bộ." }, { status: 400 });
  }
  if (reading.status === "COMPLETED" && reading.content) return NextResponse.json({ status: "ready", readingId: reading.id });
  if (reading.status === "FAILED" || reading.status === "REFUNDED") {
    return NextResponse.json({ status: "failed", readingId: reading.id, refunded: reading.status === "REFUNDED" });
  }

  const locks = readingJobLocks();
  if (locks.has(id)) return NextResponse.json({ status: "processing", readingId: id }, { status: 202 });
  locks.add(id);

  after(() => runFullReadingJob(id, user, reading));

  return NextResponse.json({ status: "processing", readingId: id }, { status: 202 });
}
