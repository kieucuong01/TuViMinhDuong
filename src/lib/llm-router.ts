export type LlmProvider = "deepseek" | "groq";

export type LlmResult = {
  text: string;
  model: string;
  provider: LlmProvider;
};

type GenerateOptions = {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  providerOrder?: LlmProvider[];
  thinking?: "enabled" | "disabled";
  attemptsPerProvider?: number;
  timeoutMs?: number;
  accept?: (result: LlmResult) => boolean;
};

class ProviderRateLimitError extends Error {}

function keysFromEnv(singleName: string, listName: string) {
  const raw = [process.env[singleName], process.env[listName]].filter(Boolean).join(",");
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function providerOrder(override?: LlmProvider[]): LlmProvider[] {
  const configured = (override?.length ? override.join(",") : process.env.LLM_PROVIDER_ORDER || "deepseek,groq")
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is LlmProvider => item === "deepseek" || item === "groq");

  return configured.length ? configured : ["deepseek", "groq"];
}

function hashPrompt(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function selectKey(keys: string[], prompt: string, attempt = 0) {
  if (!keys.length) return null;
  return keys[(hashPrompt(prompt) + attempt) % keys.length];
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

function requestSignal(timeoutMs?: number) {
  return AbortSignal.timeout(Math.max(1_000, Math.min(120_000, timeoutMs ?? 60_000)));
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
    signal: requestSignal(options.timeoutMs),
  });

  if (response.status === 429) throw new ProviderRateLimitError("Groq rate limited");
  if (!response.ok) throw new Error(`Groq error ${response.status}: ${await parseError(response)}`);

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  return { text: assertText(text, "groq"), model: `groq/${model}`, provider: "groq" };
}

async function callDeepSeek(options: GenerateOptions, key: string): Promise<LlmResult> {
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const response = await fetch("https://api.deepseek.com/chat/completions", {
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
      ...(options.thinking ? { thinking: { type: options.thinking } } : {}),
    }),
    signal: requestSignal(options.timeoutMs),
  });

  if (response.status === 429) throw new ProviderRateLimitError("DeepSeek rate limited");
  if (!response.ok) throw new Error(`DeepSeek error ${response.status}: ${await parseError(response)}`);

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  return { text: assertText(text, "deepseek"), model: `deepseek/${model}`, provider: "deepseek" };
}

export function hasExternalLlmProvider() {
  return Boolean(
    keysFromEnv("DEEPSEEK_API_KEY", "DEEPSEEK_API_KEYS").length ||
      keysFromEnv("GROQ_API_KEY", "GROQ_API_KEYS").length,
  );
}

export async function generateWithLlmRouter(options: GenerateOptions): Promise<LlmResult | null> {
  const deepSeekKeys = keysFromEnv("DEEPSEEK_API_KEY", "DEEPSEEK_API_KEYS");
  const groqKeys = keysFromEnv("GROQ_API_KEY", "GROQ_API_KEYS");
  const errors: string[] = [];
  const attemptsPerProvider = Math.max(1, Math.min(3, Math.floor(options.attemptsPerProvider ?? 1)));

  for (const provider of providerOrder(options.providerOrder)) {
    const keys = provider === "deepseek" ? deepSeekKeys : groqKeys;
    if (!keys.length) continue;

    for (let attempt = 0; attempt < attemptsPerProvider; attempt += 1) {
      const key = selectKey(keys, options.prompt, attempt);
      if (!key) continue;
      try {
        const result = provider === "deepseek" ? await callDeepSeek(options, key) : await callGroq(options, key);
        if (!options.accept || options.accept(result)) return result;
        errors.push(`${provider} returned a response rejected by the caller validator`);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  }

  if (errors.length) console.warn("LLM router fallback:", errors.join(" | "));
  return null;
}
