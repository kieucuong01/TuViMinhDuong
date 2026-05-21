type LlmProvider = "gemini" | "groq";

export type LlmResult = {
  text: string;
  model: string;
  provider: LlmProvider;
};

type GenerateOptions = {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
};

class ProviderRateLimitError extends Error {}

function keysFromEnv(singleName: string, listName: string) {
  const raw = [process.env[singleName], process.env[listName]].filter(Boolean).join(",");
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function providerOrder(): LlmProvider[] {
  const configured = (process.env.LLM_PROVIDER_ORDER || "gemini,groq")
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is LlmProvider => item === "gemini" || item === "groq");

  return configured.length ? configured : ["gemini", "groq"];
}

function hashPrompt(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function selectKey(keys: string[], prompt: string) {
  if (!keys.length) return null;
  return keys[hashPrompt(prompt) % keys.length];
}

async function parseError(response: Response) {
  try {
    const json = await response.json();
    return JSON.stringify(json).slice(0, 500);
  } catch {
    return response.statusText;
  }
}

function assertText(text: unknown, provider: LlmProvider) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(`${provider} returned an empty response`);
  }
  return text.trim();
}

async function callGemini(options: GenerateOptions, key: string): Promise<LlmResult> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.55,
          maxOutputTokens: options.maxTokens ?? 1200,
        },
      }),
    },
  );

  if (response.status === 429) throw new ProviderRateLimitError("Gemini rate limited");
  if (!response.ok) throw new Error(`Gemini error ${response.status}: ${await parseError(response)}`);

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("\n");
  return { text: assertText(text, "gemini"), model: `gemini/${model}`, provider: "gemini" };
}

async function callGroq(options: GenerateOptions, key: string): Promise<LlmResult> {
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: options.prompt }],
      temperature: options.temperature ?? 0.55,
      max_tokens: options.maxTokens ?? 1200,
    }),
  });

  if (response.status === 429) throw new ProviderRateLimitError("Groq rate limited");
  if (!response.ok) throw new Error(`Groq error ${response.status}: ${await parseError(response)}`);

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  return { text: assertText(text, "groq"), model: `groq/${model}`, provider: "groq" };
}

export function hasExternalLlmProvider() {
  return Boolean(
    keysFromEnv("GEMINI_API_KEY", "GEMINI_API_KEYS").length ||
      keysFromEnv("GROQ_API_KEY", "GROQ_API_KEYS").length,
  );
}

export async function generateWithLlmRouter(options: GenerateOptions): Promise<LlmResult | null> {
  const geminiKeys = keysFromEnv("GEMINI_API_KEY", "GEMINI_API_KEYS");
  const groqKeys = keysFromEnv("GROQ_API_KEY", "GROQ_API_KEYS");
  const errors: string[] = [];

  for (const provider of providerOrder()) {
    const keys = provider === "gemini" ? geminiKeys : groqKeys;
    const key = selectKey(keys, options.prompt);
    if (!key) continue;

    try {
      return provider === "gemini" ? await callGemini(options, key) : await callGroq(options, key);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      if (error instanceof ProviderRateLimitError) continue;
    }
  }

  if (errors.length) console.warn("LLM router fallback:", errors.join(" | "));
  return null;
}
