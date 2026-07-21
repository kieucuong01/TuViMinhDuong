import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { answerChartQuestion, ChartAssistantError, type ChartAssistantDeps } from "@/lib/chart-assistant";
import {
  completeAssistantQuestion,
  getCompletedAssistantReading,
  getOwnedAssistantChart,
  listAssistantQuestions,
  reserveAssistantQuestionSlot,
} from "@/lib/chart-assistant-store";
import { generateWithLlmRouter } from "@/lib/llm-router";

const assistantDeps: ChartAssistantDeps = {
  getOwnedChart: getOwnedAssistantChart,
  getCompletedFullReading: getCompletedAssistantReading,
  listQuestionHistory: listAssistantQuestions,
  reserveQuestionSlot: reserveAssistantQuestionSlot,
  completeQuestion: completeAssistantQuestion,
  generate: async (prompt) => {
    const generated = await generateWithLlmRouter({
      prompt,
      temperature: 0.45,
      maxTokens: 900,
      providerOrder: ["deepseek"],
    });
    return generated ? { text: generated.text, model: generated.model } : null;
  },
};

function domainErrorResponse(error: ChartAssistantError) {
  if (error.code === "NOT_FOUND") {
    return NextResponse.json({ error: "Không tìm thấy lá số phù hợp." }, { status: 404 });
  }
  if (error.code === "FULL_REQUIRED") {
    return NextResponse.json(
      { error: "Bạn cần mở Hồ sơ VIP trước khi dùng Cố vấn AI.", action: "unlock-full" },
      { status: 403 },
    );
  }
  return NextResponse.json(
    { error: "Bạn đã sử dụng đủ 3 câu hỏi Cố vấn AI.", remaining: 0 },
    { status: 409 },
  );
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để dùng Cố vấn AI.", action: "login" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { chartId?: string; question?: string };
    const chartId = String(body.chartId || "").trim();
    const question = String(body.question || "").trim().slice(0, 600);
    if (!chartId || !question) {
      return NextResponse.json({ error: "Thiếu mã lá số hoặc câu hỏi." }, { status: 400 });
    }

    const result = await answerChartQuestion(assistantDeps, { user, chartId, question });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChartAssistantError) return domainErrorResponse(error);
    return NextResponse.json({ error: "Không thể xử lý câu hỏi lúc này." }, { status: 500 });
  }
}
