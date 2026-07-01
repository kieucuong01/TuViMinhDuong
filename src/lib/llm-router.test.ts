import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWithLlmRouter, hasExternalLlmProvider } from "@/lib/llm-router";

const routerSource = readFileSync(fileURLToPath(new URL("./llm-router.ts", import.meta.url)), "utf8");
const removedSingleKey = ["GEM", "INI_API_KEY"].join("");
const removedKeyList = ["GEM", "INI_API_KEYS"].join("");
const oldEnv = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_API_KEYS: process.env.DEEPSEEK_API_KEYS,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_API_KEYS: process.env.GROQ_API_KEYS,
  GROQ_MODEL: process.env.GROQ_MODEL,
  LLM_PROVIDER_ORDER: process.env.LLM_PROVIDER_ORDER,
  [removedSingleKey]: process.env[removedSingleKey],
  [removedKeyList]: process.env[removedKeyList],
};

beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.DEEPSEEK_API_KEYS = "";
  process.env.GROQ_API_KEY = "";
  process.env.GROQ_API_KEYS = "";
  process.env.LLM_PROVIDER_ORDER = "";
  process.env[removedSingleKey] = "";
  process.env[removedKeyList] = "";
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function providerResponse(text: string) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: text } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("LLM router", () => {
  it("returns null when no external provider key is configured", async () => {
    expect(hasExternalLlmProvider()).toBe(false);
    await expect(generateWithLlmRouter({ prompt: "hello" })).resolves.toBeNull();
  });

  it("uses DeepSeek with the current V4 Flash model", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(providerResponse("Bản luận giải cá nhân"));

    const result = await generateWithLlmRouter({ prompt: "Luận giải lá số" });

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

  it("falls back from a DeepSeek rate limit to Groq", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-test-key";
    process.env.GROQ_API_KEY = "groq-test-key";
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "rate" }), { status: 429 }))
      .mockResolvedValueOnce(providerResponse("Groq fallback answer"));

    const result = await generateWithLlmRouter({ prompt: "Luận giải lá số" });

    expect(result?.provider).toBe("groq");
    expect(result?.text).toBe("Groq fallback answer");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("defaults to DeepSeek before Groq", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-test-key";
    process.env.GROQ_API_KEY = "groq-test-key";
    process.env.LLM_PROVIDER_ORDER = "";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(providerResponse("DeepSeek default answer"));

    const result = await generateWithLlmRouter({ prompt: "Viết luận giải" });

    expect(result?.provider).toBe("deepseek");
    expect(fetch).toHaveBeenCalledWith("https://api.deepseek.com/chat/completions", expect.any(Object));
  });

  it("honors a supported per-request provider order", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-test-key";
    process.env.GROQ_API_KEY = "groq-test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(providerResponse("Groq answer"));

    const result = await generateWithLlmRouter({
      prompt: "Viết luận giải",
      providerOrder: ["groq", "deepseek"],
    });

    expect(result?.provider).toBe("groq");
    expect(fetch).toHaveBeenCalledWith("https://api.groq.com/openai/v1/chat/completions", expect.any(Object));
  });

  it("ignores unsupported providers in the environment order", async () => {
    process.env.GROQ_API_KEY = "groq-test-key";
    process.env.LLM_PROVIDER_ORDER = "removed-provider,groq";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(providerResponse("Groq answer"));

    const result = await generateWithLlmRouter({ prompt: "Viết luận giải" });

    expect(result?.provider).toBe("groq");
    expect(result?.text).toBe("Groq answer");
  });

  it("contains no removed provider implementation", () => {
    const removedProviderName = ["gem", "ini"].join("");
    const removedEnvPrefix = ["GEM", "INI_"].join("");

    expect(routerSource.toLowerCase()).not.toContain(removedProviderName);
    expect(routerSource).not.toContain(removedEnvPrefix);
    expect(routerSource).not.toContain("generativelanguage.googleapis.com");
  });
});
