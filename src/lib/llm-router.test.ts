import { afterEach, describe, expect, it, vi } from "vitest";
import { generateWithLlmRouter, hasExternalLlmProvider } from "@/lib/llm-router";

const oldEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_API_KEYS: process.env.GEMINI_API_KEYS,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_API_KEYS: process.env.GROQ_API_KEYS,
  GROQ_MODEL: process.env.GROQ_MODEL,
  LLM_PROVIDER_ORDER: process.env.LLM_PROVIDER_ORDER,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  restoreEnv();
});

describe("LLM router", () => {
  it("returns null when no Gemini or Groq key is configured", async () => {
    process.env.GEMINI_API_KEY = "";
    process.env.GEMINI_API_KEYS = "";
    process.env.GROQ_API_KEY = "";
    process.env.GROQ_API_KEYS = "";

    expect(hasExternalLlmProvider()).toBe(false);
    await expect(generateWithLlmRouter({ prompt: "hello" })).resolves.toBeNull();
  });

  it("uses Gemini when configured", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GROQ_API_KEY = "";
    process.env.LLM_PROVIDER_ORDER = "gemini";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Gemini answer" }] } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await generateWithLlmRouter({ prompt: "Viết luận giải" });

    expect(result?.provider).toBe("gemini");
    expect(result?.text).toBe("Gemini answer");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("generativelanguage.googleapis.com"), expect.any(Object));
  });

  it("falls back from Gemini rate limit to Groq", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GROQ_API_KEY = "groq-test-key";
    process.env.LLM_PROVIDER_ORDER = "gemini,groq";

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "rate" }), { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Groq answer" } }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await generateWithLlmRouter({ prompt: "Viết luận giải" });

    expect(result?.provider).toBe("groq");
    expect(result?.text).toBe("Groq answer");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
