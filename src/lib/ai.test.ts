import { afterEach, describe, expect, it } from "vitest";
import { generateReading } from "@/lib/ai";
import { generateTuViChart } from "@/lib/chart";

const oldGatewayKey = process.env.AI_GATEWAY_API_KEY;
const oldOidcToken = process.env.VERCEL_OIDC_TOKEN;

afterEach(() => {
  if (oldGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY = oldGatewayKey;

  if (oldOidcToken === undefined) delete process.env.VERCEL_OIDC_TOKEN;
  else process.env.VERCEL_OIDC_TOKEN = oldOidcToken;
});

describe("AI reading format", () => {
  it("uses the fixed mobile-friendly section order for fallback readings", async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;

    const chart = generateTuViChart({
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

    const { content } = await generateReading(chart, "FULL", "overview");
    const headings = [
      "## Tổng quan",
      "## Điểm mạnh",
      "## Điều cần lưu ý",
      "## Công việc",
      "## Tài chính",
      "## Tình cảm",
      "## Sức khỏe",
      "## Vận hạn năm",
    ];

    let lastIndex = -1;
    for (const heading of headings) {
      const index = content.indexOf(heading);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }

    expect(content).not.toContain("## Gợi ý hành động");
    expect(content).not.toContain("## Mốc thời gian nên chú ý");
  });
});
