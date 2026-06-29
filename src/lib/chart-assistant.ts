import type { SessionUser } from "@/lib/auth";
import type { TuViChart } from "@/lib/chart";
import { buildChartEvidenceProfile, formatChartEvidence } from "@/lib/chart-evidence";

export type ChartAssistantErrorCode = "NOT_FOUND" | "FULL_REQUIRED" | "QUOTA_EXHAUSTED";

export class ChartAssistantError extends Error {
  constructor(public readonly code: ChartAssistantErrorCode) {
    super(code);
    this.name = "ChartAssistantError";
  }
}

export type AssistantHistoryItem = {
  id: string;
  slot: number;
  question: string;
  answer: string | null;
  model: string | null;
};

type SlotReservation = {
  id: string;
  slot: number;
  question: string;
};

type CompletedFullReading = {
  id: string;
  content: string | null;
};

export type ChartAssistantDeps = {
  getOwnedChart: (user: SessionUser, chartId: string) => Promise<TuViChart | null>;
  getCompletedFullReading: (userId: string, chartId: string) => Promise<CompletedFullReading | null>;
  listQuestionHistory: (userId: string, chartId: string) => Promise<AssistantHistoryItem[]>;
  reserveQuestionSlot: (
    userId: string,
    chartId: string,
    readingId: string,
    question: string,
  ) => Promise<SlotReservation | null>;
  completeQuestion: (
    reservation: SlotReservation,
    answer: string,
    model: string,
  ) => Promise<AssistantHistoryItem>;
  generate: (prompt: string) => Promise<{ text: string; model: string } | null>;
};

function compactPaidContext(content: string | null) {
  if (!content?.trim()) return "Bản FULL đã hoàn thành nhưng không có phần tóm tắt văn bản.";
  return content.replace(/\s+/g, " ").trim().slice(0, 2500);
}

function conversationContext(history: AssistantHistoryItem[]) {
  if (!history.length) return "Chưa có câu hỏi trước.";
  return history
    .filter((item) => item.answer)
    .slice(-2)
    .map((item) => `Câu ${item.slot}: ${item.question}\nTrả lời: ${item.answer}`)
    .join("\n\n");
}

function assistantPrompt(
  chart: TuViChart,
  paidReading: CompletedFullReading,
  history: AssistantHistoryItem[],
  question: string,
) {
  return `Bạn là cố vấn định hướng tử vi cho một người đã mua hồ sơ VIP. Chỉ trả lời dựa trên bằng chứng lá số và bối cảnh đã cấp.

Hồ sơ bằng chứng:
${formatChartEvidence(buildChartEvidenceProfile(chart))}

Tóm tắt hồ sơ VIP đã mua:
${compactPaidContext(paidReading.content)}

Trao đổi trước:
${conversationContext(history)}

Câu hỏi hiện tại:
${question}

Yêu cầu:
- Trả lời bằng tiếng Việt, 120-220 từ, đi thẳng vào câu hỏi.
- Nêu 1-3 bằng chứng cung/sao hoặc đại vận thực sự có trong hồ sơ.
- Chuyển diễn giải thành hành động có thể kiểm chứng trong đời sống hoặc tài chính.
- Không tự an sao, không bịa mốc thời gian, không khẳng định kết quả chắc chắn.
- Không thay thế tư vấn tài chính, pháp lý hoặc y tế chuyên môn.`;
}

function fallbackAnswer(chart: TuViChart) {
  const profile = buildChartEvidenceProfile(chart);
  const opportunity = profile.signals.find((signal) => signal.kind === "opportunity");
  const caution = profile.signals.find((signal) => signal.kind === "caution");
  return `Theo dữ liệu lá số hiện tại, điểm nên ưu tiên là ${opportunity?.summary.toLowerCase() || "đối chiếu Mệnh, Thân và vận hiện tại"}. Dẫn chứng chính: ${opportunity?.evidence.join("; ") || `Mệnh ${profile.menh}, Thân tại ${profile.than}`}. Vùng cần đi chậm là ${caution?.evidence.join("; ") || "những quyết định thiếu dữ liệu"}. Đây là tín hiệu tham khảo, không phải kết luận chắc chắn. Bạn nên chia quyết định thành bước nhỏ, đặt hạn mức rủi ro và chọn một mốc kiểm tra lại trước khi cam kết thêm tiền bạc hoặc thời gian.`;
}

export async function answerChartQuestion(
  deps: ChartAssistantDeps,
  input: { user: SessionUser; chartId: string; question: string },
) {
  const question = input.question.trim();
  const chart = await deps.getOwnedChart(input.user, input.chartId);
  if (!chart) throw new ChartAssistantError("NOT_FOUND");

  const paidReading = await deps.getCompletedFullReading(input.user.id, input.chartId);
  if (!paidReading) throw new ChartAssistantError("FULL_REQUIRED");

  const history = await deps.listQuestionHistory(input.user.id, input.chartId);
  const reservation = await deps.reserveQuestionSlot(input.user.id, input.chartId, paidReading.id, question);
  if (!reservation) throw new ChartAssistantError("QUOTA_EXHAUSTED");

  const generated = await deps.generate(assistantPrompt(chart, paidReading, history, question));
  const answer = generated?.text.trim() || fallbackAnswer(chart);
  const model = generated?.model || "template-fallback";
  const completed = await deps.completeQuestion(reservation, answer, model);
  const nextHistory = [...history.filter((item) => item.id !== completed.id), completed].sort((a, b) => a.slot - b.slot);

  return {
    answer,
    model,
    remaining: Math.max(0, 3 - completed.slot),
    history: nextHistory,
  };
}
