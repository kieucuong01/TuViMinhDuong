import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../../scripts/check-production-env.mjs", import.meta.url)),
  "utf8",
);

describe("production LLM environment contract", () => {
  it("accepts only DeepSeek and Groq provider keys", () => {
    const removedEnvPrefix = ["GEM", "INI_"].join("");

    expect(source).toContain('["DEEPSEEK_API_KEY", "DEEPSEEK_API_KEYS"]');
    expect(source).toContain('["GROQ_API_KEY", "GROQ_API_KEYS"]');
    expect(source).toContain("DEEPSEEK_* and GROQ_* all missing");
    expect(source).not.toContain(removedEnvPrefix);
  });
});
