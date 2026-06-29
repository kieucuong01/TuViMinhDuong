import { describe, expect, it, vi } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import {
  ChartAssistantError,
  answerChartQuestion,
  type AssistantHistoryItem,
  type ChartAssistantDeps,
} from "@/lib/chart-assistant";
import type { SessionUser } from "@/lib/auth";

const user: SessionUser = {
  id: "user-1",
  email: "reader@example.com",
  name: "Người đọc",
  role: "USER",
  coinBalance: 0,
};

function chart() {
  return generateTuViChart({
    fullName: "Nguyễn Minh Anh",
    gender: "female",
    calendarType: "solar",
    day: 19,
    month: 5,
    year: 1990,
    birthHour: 8,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

function deps(overrides: Partial<ChartAssistantDeps> = {}): ChartAssistantDeps {
  const history: AssistantHistoryItem[] = [];
  return {
    getOwnedChart: vi.fn(async () => chart()),
    getCompletedFullReading: vi.fn(async () => ({
      id: "reading-1",
      content: "# Hồ sơ VIP\nCung Tài Bạch cần quản trị dòng tiền.",
    })),
    listQuestionHistory: vi.fn(async () => history),
    reserveQuestionSlot: vi.fn(async (_userId, _chartId, _readingId, question) => ({
      id: "question-1",
      slot: 1,
      question,
    })),
    completeQuestion: vi.fn(async (reservation, answer, model) => {
      const completed = { ...reservation, answer, model };
      history.push(completed);
      return completed;
    }),
    generate: vi.fn(async () => ({
      text: "Nên giữ quỹ dự phòng và kiểm tra điều khoản trước quyết định lớn.",
      model: "deepseek/deepseek-v4-flash",
    })),
    ...overrides,
  };
}

describe("chart-aware assistant", () => {
  it("reserves one of three slots and returns the remaining quota", async () => {
    const harness = deps();

    const result = await answerChartQuestion(harness, {
      user,
      chartId: "chart-1",
      question: "Tài chính năm nay cần chú ý gì?",
    });

    expect(result.remaining).toBe(2);
    expect(result.model).toBe("deepseek/deepseek-v4-flash");
    expect(harness.reserveQuestionSlot).toHaveBeenCalledWith(
      "user-1",
      "chart-1",
      "reading-1",
      "Tài chính năm nay cần chú ý gì?",
    );
    expect(harness.completeQuestion).toHaveBeenCalledTimes(1);
  });

  it("requires an owned chart and a completed full reading", async () => {
    await expect(
      answerChartQuestion(deps({ getOwnedChart: vi.fn(async () => null) }), {
        user,
        chartId: "foreign-chart",
        question: "Tôi nên xem gì?",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      answerChartQuestion(deps({ getCompletedFullReading: vi.fn(async () => null) }), {
        user,
        chartId: "chart-1",
        question: "Tôi nên xem gì?",
      }),
    ).rejects.toMatchObject({ code: "FULL_REQUIRED" });
  });

  it("rejects a fourth question when no slot can be reserved", async () => {
    await expect(
      answerChartQuestion(deps({ reserveQuestionSlot: vi.fn(async () => null) }), {
        user,
        chartId: "chart-1",
        question: "Câu hỏi thứ tư",
      }),
    ).rejects.toEqual(new ChartAssistantError("QUOTA_EXHAUSTED"));
  });

  it("includes chart evidence, paid context, and earlier questions in the prompt", async () => {
    const generate = vi.fn(async (_prompt: string) => ({ text: "Câu trả lời", model: "groq/test" }));
    const harness = deps({
      listQuestionHistory: vi.fn(async () => [
        {
          id: "old-question",
          slot: 1,
          question: "Điểm mạnh của tôi là gì?",
          answer: "Cung Mệnh cho thấy khả năng tổ chức.",
          model: "deepseek/test",
        },
      ]),
      reserveQuestionSlot: vi.fn(async (_userId, _chartId, _readingId, question) => ({
        id: "question-2",
        slot: 2,
        question,
      })),
      generate,
    });

    const result = await answerChartQuestion(harness, {
      user,
      chartId: "chart-1",
      question: "Tôi áp dụng điểm mạnh đó vào công việc thế nào?",
    });

    const prompt = String(generate.mock.calls[0][0]);
    expect(prompt).toContain("Tín hiệu ưu tiên");
    expect(prompt).toContain("Cung Tài Bạch cần quản trị dòng tiền");
    expect(prompt).toContain("Điểm mạnh của tôi là gì?");
    expect(prompt).toContain("Tôi áp dụng điểm mạnh đó");
    expect(result.remaining).toBe(1);
  });

  it("persists an evidence-based fallback when both providers are unavailable", async () => {
    const harness = deps({ generate: vi.fn(async () => null) });

    const result = await answerChartQuestion(harness, {
      user,
      chartId: "chart-1",
      question: "Năm nay nên ưu tiên gì?",
    });

    expect(result.model).toBe("template-fallback");
    expect(result.answer).toContain("lá số");
    expect(harness.completeQuestion).toHaveBeenCalledTimes(1);
  });
});
