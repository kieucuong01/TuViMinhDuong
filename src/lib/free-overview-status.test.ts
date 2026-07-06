import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateTuViChart, type TuViChart } from "@/lib/chart";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

function chartFixture(): TuViChart {
  return generateTuViChart({
    fullName: "Kieu Tan Cuong",
    gender: "male",
    calendarType: "solar",
    day: 7,
    month: 5,
    year: 1995,
    birthHour: 4,
    birthMinute: 0,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

function completeOverviewContent() {
  const filler = Array.from({ length: 980 }, () => "dữ-liệu").join(" ");
  return `## Tín hiệu nổi bật của lá số
Với cung Mệnh có Tử Vi, lá số này không đi theo kiểu may rủi nhất thời mà nghiêng về năng lực dựng khung, nhìn vấn đề và giữ nhịp khi xung quanh bắt đầu rối. Điểm khiến người đọc dễ thấy đúng là bên ngoài có thể khá điềm, nhưng bên trong lại thường tự tính rất nhiều đường trước khi quyết. Trục Quan Lộc và Tài Bạch cho thấy cơ hội không thiếu, nhưng chỉ mở ra giá trị thật khi phạm vi, quyền hạn và dòng tiền được nói rõ từ đầu. Nếu muốn biết nên chọn cơ hội nào, tránh điểm nghẽn nào và năm 2026 nên đi nhanh hay đi chắc, phần hồ sơ chuyên sâu sẽ nối các cung, sao và đại vận thành một bản định hướng cụ thể hơn.

## Mỏ neo
- **Năng lượng nội lực: nền ổn định** — Cung Mệnh có Tử Vi.
- **Nhịp công việc & tài chính: chọn lọc trước khi nhận** — Cung Quan Lộc cần chủ động.
- **Tín hiệu năm 2026: tiến từng bước có kiểm chứng** — Đại vận nhắc giữ nhịp.

## Điểm đáng chú ý nhất
Cung Mệnh và đại vận hiện tại tạo ra một điểm chuyển. ${filler}

## Khí chất và nội lực
Mệnh và Thân cho thấy khả năng tổ chức.

## Công việc và tài chính
Cung Quan Lộc và Tài Bạch cần được đối chiếu trước quyết định.

## Tình cảm và quan hệ
Cung Phu Thê nhắc giữ ranh giới rõ ràng.

## Sức khỏe và nhịp sống
Cung Tật Ách chỉ dùng để nhắc nhịp nghỉ ngơi.

## Vận năm 2026
Tuần tại Thiên Di là tín hiệu nên kiểm chứng.

## Câu hỏi mở trước khi đi sâu
- Năm 2026, đâu là lựa chọn cần đọc sâu trước khi quyết?
- Cơ hội nào đang mở ra thật, và cơ hội nào chỉ tạo áp lực?
- Vì sao cùng một mối quan hệ có lúc hỗ trợ, có lúc làm hao sức?
- Điểm nghẽn nào cần đối chiếu với đại vận trước khi hành động?`;
}

describe("free overview status", () => {
  it("starts only the full LLM generation because the instant template covers the waiting state", () => {
    const source = readFileSync(fileURLToPath(new URL("./data.ts", import.meta.url)), "utf8");
    const fullStart = source.indexOf("const fullOverviewPromise = generateFreeOverview(record.chart)");

    expect(fullStart).toBeGreaterThan(-1);
    expect(source).toContain("const result = await fullOverviewPromise");
    expect(source).not.toContain("generateFreeOverviewPreview");
    expect(source).not.toContain("freeOverviewPreview:");
  });

  it("returns an 800-900 word template while no LLM content is cached yet", async () => {
    const {
      FREE_OVERVIEW_TEMPLATE_MAX_WORDS,
      FREE_OVERVIEW_TEMPLATE_MIN_WORDS,
    } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const status = getFreeOverviewStatus(chartFixture());

    expect(status.status).toBe("fallback");
    expect(status.source).toBe("template-fallback");
    expect(status.content).toContain("## Tín hiệu nổi bật của lá số");
    expect(status.content).toContain("bản chi tiết đang được viết tiếp");
    expect(status.wordCount).toBeGreaterThanOrEqual(FREE_OVERVIEW_TEMPLATE_MIN_WORDS);
    expect(status.wordCount).toBeLessThanOrEqual(FREE_OVERVIEW_TEMPLATE_MAX_WORDS);
  });

  it("treats complete matching-version AI content as ready", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverview: {
        content: completeOverviewContent(),
        model: "test-model",
        generatedAt: "2026-06-02T00:00:00.000Z",
        version: FREE_OVERVIEW_VERSION,
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("ready");
    expect(status.source).toBe("ai-cache");
    expect(status.model).toBe("test-model");
  });

  it("marks current pending overview jobs as processing", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverviewJob: {
        status: "PENDING",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: FREE_OVERVIEW_VERSION,
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("fallback");
    expect(status.jobStatus).toBe("processing");
  });

  it("marks old pending overview jobs as stale so they can be retried", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverviewJob: {
        status: "PENDING",
        startedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        version: FREE_OVERVIEW_VERSION,
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("fallback");
    expect(status.jobStatus).toBe("stale");
  });

  it("keeps failed overview errors visible while serving the pending state", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverviewJob: {
        status: "FAILED",
        startedAt: "2026-06-02T00:00:00.000Z",
        updatedAt: "2026-06-02T00:01:00.000Z",
        version: FREE_OVERVIEW_VERSION,
        error: "LLM timed out",
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("fallback");
    expect(status.jobStatus).toBe("failed");
    expect(status.error).toBe("LLM timed out");
  });
});
