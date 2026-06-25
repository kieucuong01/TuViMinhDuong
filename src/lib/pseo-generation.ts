import { auditPseoPage, type PseoAuditFinding } from "@/lib/pseo-audit";
import type { PseoPageDraft } from "@/lib/pseo-registry";

export type GeneratedPseoPage = PseoPageDraft & {
  auditFindings: PseoAuditFinding[];
};

export async function generatePseoBatch(
  pages: PseoPageDraft[],
  generate: (page: PseoPageDraft, attempt: number) => Promise<string>,
): Promise<GeneratedPseoPage[]> {
  const results: GeneratedPseoPage[] = [];
  for (const source of pages) {
    let candidate = source;
    let findings = auditPseoPage(candidate);
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      candidate = { ...source, body: await generate(source, attempt), status: "DRAFT" };
      findings = auditPseoPage(candidate);
      if (!findings.some((finding) => finding.severity === "error")) break;
    }
    const hasErrors = findings.some((finding) => finding.severity === "error");
    results.push({
      ...candidate,
      status: hasErrors ? "DRAFT" : "PUBLISHED",
      robots: hasErrors ? "noindex,follow" : "index,follow",
      auditFindings: findings,
    });
  }
  return results;
}
