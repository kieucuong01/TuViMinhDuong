import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AI discovery", () => {
  it("publishes a concise llms.txt with the core public tools", () => {
    expect(existsSync("public/llms.txt")).toBe(true);
    const source = readFileSync("public/llms.txt", "utf8");

    for (const route of ["/", "/xem-ngay", "/xem-tuoi", "/tra-cuu", "/kien-thuc-tu-vi"]) {
      expect(source).toContain(`https://lasotinhhoa.vn${route}`);
    }
  });
});
