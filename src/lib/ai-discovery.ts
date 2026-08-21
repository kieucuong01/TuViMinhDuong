export const AI_DISCOVERY_SOURCES = ["ai", "organic_search", "youtube", "facebook", "friend", "other"] as const;
export const AI_DISCOVERY_PLATFORMS = ["chatgpt", "gemini", "claude", "perplexity", "other"] as const;

export type AiDiscoverySource = (typeof AI_DISCOVERY_SOURCES)[number];
export type AiDiscoveryPlatform = (typeof AI_DISCOVERY_PLATFORMS)[number];
export type AiDiscoverySubmission = {
  chartId: string;
  source: AiDiscoverySource;
  aiPlatform?: AiDiscoveryPlatform;
  prompt?: string;
};

const SOURCE_SET = new Set<string>(AI_DISCOVERY_SOURCES);
const PLATFORM_SET = new Set<string>(AI_DISCOVERY_PLATFORMS);
const ALLOWED_KEYS = new Set(["chartId", "source", "aiPlatform", "prompt"]);
const CHART_ID_PATTERN = /^c[a-z0-9]{20,31}$/;
const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const PHONE_PATTERN = /(?:\+?84|0)\s?(?:\d[\s.-]?){8,10}\d/;
const BIRTH_DATE_PATTERN = /\b(?:0?[1-9]|[12]\d|3[01])[/-](?:0?[1-9]|1[0-2])[/-](?:19|20)\d{2}\b/;

function cleanPrompt(value: string) {
  const prompt = value.replace(/\s+/g, " ").trim();
  if (!prompt || prompt.length > 500) return null;
  if (EMAIL_PATTERN.test(prompt) || PHONE_PATTERN.test(prompt) || BIRTH_DATE_PATTERN.test(prompt)) return null;
  return prompt;
}

export function parseAiDiscoverySubmission(value: unknown): AiDiscoverySubmission | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !ALLOWED_KEYS.has(key))) return null;
  if (typeof record.chartId !== "string" || !CHART_ID_PATTERN.test(record.chartId)) return null;
  if (typeof record.source !== "string" || !SOURCE_SET.has(record.source)) return null;

  const source = record.source as AiDiscoverySource;
  if (source !== "ai") {
    if (record.aiPlatform !== undefined || record.prompt !== undefined) return null;
    return { chartId: record.chartId, source };
  }

  if (typeof record.aiPlatform !== "string" || !PLATFORM_SET.has(record.aiPlatform)) return null;
  if (record.prompt !== undefined && typeof record.prompt !== "string") return null;
  const prompt = record.prompt === undefined ? undefined : cleanPrompt(record.prompt);
  if (record.prompt !== undefined && !prompt) return null;

  return {
    chartId: record.chartId,
    source,
    aiPlatform: record.aiPlatform as AiDiscoveryPlatform,
    ...(prompt ? { prompt } : {}),
  };
}
