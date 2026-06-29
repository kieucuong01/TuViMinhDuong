import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWithLlmRouter, hasExternalLlmProvider } from "@/lib/llm-router";

const oldEnv = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_API_KEYS: process.env.DEEPSEEK_API_KEYS,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_API_KEYS: process.env.GEMINI_API_KEYS,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_API_KEYS: process.env.GROQ_API_KEYS,
  GROQ_MODEL: process.env.GROQ_MODEL,
  LLM_PROVIDER_ORDER: process.env.LLM_PROVIDER_ORDER,
};

beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.DEEPSEEK_API_KEYS = "";
  process.env.GEMINI_API_KEY = "";
  process.env.GEMINI_API_KEYS = "";
  process.env.GROQ_API_KEY = "";
  process.env.GROQ_API_KEYS = "";
});

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
  it("returns null when no external provider key is configured", async () => {
    expect(hasExternalLlmProvider()).toBe(false);
    await expect(generateWithLlmRouter({ prompt: "hello" })).resolves.toBeNull();
  });

  it("uses DeepSeek with the current V4 Flash model", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Bản luận giải cá nhân" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await generateWithLlmRouter({
      prompt: "Luận giải lá số",
      providerOrder: ["deepseek", "groq"],
    });

    expect(hasExternalLlmProvider()).toBe(true);
    expect(result).toMatchObject({
      provider: "deepseek",
      model: "deepseek/deepseek-v4-flash",
      text: "Bản luận giải cá nhân",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer deepseek-test-key" }),
      }),
    );
  });

  it("falls back from DeepSeek rate limit to Groq", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-test-key";
    process.env.GROQ_API_KEY = "groq-test-key";

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "rate" }), { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Groq fallback answer" } }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await generateWithLlmRouter({
      prompt: "Luận giải lá số",
      providerOrder: ["deepseek", "groq"],
    });

    expect(result?.provider).toBe("groq");
    expect(result?.text).toBe("Groq fallback answer");
    expect(fetch).toHaveBeenCalledTimes(2);
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

  it("defaults to Groq before Gemini when both providers are configured", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GROQ_API_KEY = "groq-test-key";
    process.env.LLM_PROVIDER_ORDER = "";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Groq default answer" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await generateWithLlmRouter({ prompt: "Viết luận giải" });

    expect(result?.provider).toBe("groq");
    expect(result?.text).toBe("Groq default answer");
    expect(fetch).toHaveBeenCalledWith("https://api.groq.com/openai/v1/chat/completions", expect.any(Object));
  });


  it("lets callers override the Gemini model for one generation", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";
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

    const result = await generateWithLlmRouter({ prompt: "Viết luận giải", geminiModel: "gemini-3.5-flash" });

    expect(result?.model).toBe("gemini/gemini-3.5-flash");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/models/gemini-3.5-flash:generateContent"), expect.any(Object));
  });

  it("honors a per-request provider order before the env default", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GROQ_API_KEY = "groq-test-key";
    process.env.LLM_PROVIDER_ORDER = "gemini,groq";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Groq answer" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await generateWithLlmRouter({ prompt: "Viết luận giải", providerOrder: ["groq", "gemini"] });

    expect(result?.provider).toBe("groq");
    expect(result?.text).toBe("Groq answer");
    expect(fetch).toHaveBeenCalledWith("https://api.groq.com/openai/v1/chat/completions", expect.any(Object));
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
