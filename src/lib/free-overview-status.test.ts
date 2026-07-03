import { describe, expect, it, vi } from "vitest";
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
- **Nội lực: 75/100** — Cung Mệnh có Tử Vi.
- **Công việc & tài chính: 65/100** — Cung Quan Lộc cần chủ động.
- **Vận năm 2026: 55/100** — Đại vận nhắc giữ nhịp.

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

## Cẩm nang hành động
- Giữ quỹ dự phòng.
- Kiểm tra giấy tờ.
- Chia quyết định lớn thành bước nhỏ.
- Đặt mốc rà soát.
- Nghỉ trước khi quá tải.`;
}

describe("free overview status", () => {
  it("returns instant fallback when the AI overview is not cached yet", async () => {
    const { countWords, FREE_OVERVIEW_MIN_WORDS, FREE_OVERVIEW_MAX_WORDS } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const status = getFreeOverviewStatus(chartFixture());

    expect(status.status).toBe("fallback");
    expect(status.source).toBe("instant-template");
    expect(status.content).toContain("## Mỏ neo");
    expect(countWords(status.content)).toBeGreaterThanOrEqual(FREE_OVERVIEW_MIN_WORDS);
    expect(countWords(status.content)).toBeLessThanOrEqual(FREE_OVERVIEW_MAX_WORDS);
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

  it("keeps failed overview errors visible while serving the instant fallback", async () => {
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
