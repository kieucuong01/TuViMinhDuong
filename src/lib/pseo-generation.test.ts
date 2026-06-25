import { describe, expect, it } from "vitest";
import { buildPseoDraft } from "@/lib/pseo-registry";
import { generatePseoBatch } from "@/lib/pseo-generation";

describe("pSEO generation gate", () => {
  it("retries generation twice and publishes only audited output", async () => {
    let attempts = 0;
    const result = await generatePseoBatch([buildPseoDraft("thai-am", "tai-bach")], async (page) => {
      attempts += 1;
      if (attempts < 3) return "Nội dung quá ngắn";
      return page.body;
    });
    expect(attempts).toBe(3);
    expect(result[0].status).toBe("PUBLISHED");
    expect(result[0].auditFindings).toEqual([]);
  });

  it("keeps failed pages as drafts with audit findings", async () => {
    const result = await generatePseoBatch([buildPseoDraft("tu-vi", "menh")], async () => "Chắc chắn giàu có.");
    expect(result[0].status).toBe("DRAFT");
    expect(result[0].auditFindings.length).toBeGreaterThan(0);
  });
});
