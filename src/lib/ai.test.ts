import { afterEach, describe, expect, it } from "vitest";
import { FREE_OVERVIEW_MAX_WORDS, FREE_OVERVIEW_MIN_WORDS, generateFreeOverview, generateReading } from "@/lib/ai";
import { generateTuViChart } from "@/lib/chart";

const oldGatewayKey = process.env.AI_GATEWAY_API_KEY;
const oldOidcToken = process.env.VERCEL_OIDC_TOKEN;
const oldGeminiKey = process.env.GEMINI_API_KEY;
const oldGeminiKeys = process.env.GEMINI_API_KEYS;
const oldGroqKey = process.env.GROQ_API_KEY;
const oldGroqKeys = process.env.GROQ_API_KEYS;

afterEach(() => {
  if (oldGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY = oldGatewayKey;

  if (oldOidcToken === undefined) delete process.env.VERCEL_OIDC_TOKEN;
  else process.env.VERCEL_OIDC_TOKEN = oldOidcToken;

  if (oldGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = oldGeminiKey;

  if (oldGeminiKeys === undefined) delete process.env.GEMINI_API_KEYS;
  else process.env.GEMINI_API_KEYS = oldGeminiKeys;

  if (oldGroqKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = oldGroqKey;

  if (oldGroqKeys === undefined) delete process.env.GROQ_API_KEYS;
  else process.env.GROQ_API_KEYS = oldGroqKeys;
});

describe("AI reading format", () => {
  it("asks the free overview LLM prompt for a long single-request reading", async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEYS;
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEYS;

    const chart = generateTuViChart({
      fullName: "Nguyá»…n Minh Anh",
      gender: "female",
      calendarType: "solar",
      day: 19,
      month: 5,
      year: 1990,
      birthHour: 8,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    });

    const { prompt } = await generateFreeOverview(chart);

    expect(prompt).toContain(String(FREE_OVERVIEW_MIN_WORDS));
    expect(prompt).toContain(String(FREE_OVERVIEW_MAX_WORDS));
    expect(prompt).toContain("1 prompt");
    expect(prompt).toContain("QUY TẮC ĐỘ DÀI");
  });

  it("uses the fixed mobile-friendly section order for fallback readings", async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEYS;
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEYS;

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
