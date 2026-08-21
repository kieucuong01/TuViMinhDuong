import { describe, expect, it } from "vitest";

import { parseAiDiscoverySubmission } from "./ai-discovery";

const chartId = "cm9gq4t4a0001w1a2b3c4d5e6";

describe("AI discovery submission", () => {
  it("accepts an AI source with a normalized optional prompt", () => {
    expect(parseAiDiscoverySubmission({
      chartId,
      source: "ai",
      aiPlatform: "chatgpt",
      prompt: "  web lập lá số tử vi miễn phí   nào dễ hiểu? ",
    })).toEqual({
      chartId,
      source: "ai",
      aiPlatform: "chatgpt",
      prompt: "web lập lá số tử vi miễn phí nào dễ hiểu?",
    });
  });

  it("accepts a non-AI source without collecting a prompt", () => {
    expect(parseAiDiscoverySubmission({ chartId, source: "youtube" })).toEqual({
      chartId,
      source: "youtube",
    });
  });

  it.each([
    { chartId, source: "ai" },
    { chartId, source: "youtube", aiPlatform: "chatgpt" },
    { chartId, source: "facebook", prompt: "từ Facebook" },
    { chartId, source: "ai", aiPlatform: "chatgpt", prompt: "email minh@example.com" },
    { chartId, source: "ai", aiPlatform: "chatgpt", prompt: "sinh ngày 12/02/1990" },
    { chartId, source: "ai", aiPlatform: "chatgpt", prompt: "liên hệ 0901234567" },
    { chartId, source: "ai", aiPlatform: "chatgpt", prompt: "x".repeat(501) },
    { chartId: "not-a-chart", source: "ai", aiPlatform: "chatgpt" },
  ])("rejects unsafe or incoherent data %#", (value) => {
    expect(parseAiDiscoverySubmission(value)).toBeNull();
  });
});
