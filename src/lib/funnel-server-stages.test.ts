import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const actions = readFileSync("src/app/actions.ts", "utf8");
const auth = readFileSync("src/lib/auth.ts", "utf8");
const googleCallback = readFileSync("src/app/api/oauth/google/callback/route.ts", "utf8");
const magicRoute = readFileSync("src/app/api/auth/magic/route.ts", "utf8");
const checkout = readFileSync("src/lib/reading-checkout.ts", "utf8");
const payos = readFileSync("src/lib/payos.ts", "utf8");
const readingProcess = readFileSync("src/app/api/readings/[id]/process/route.ts", "utf8");
const funnelEvents = readFileSync("src/lib/funnel-events.ts", "utf8");

describe("trusted first-party funnel stages", () => {
  it("keeps a minimal indexed event model and bounded order snapshot", () => {
    expect(schema).toContain("model FunnelEvent");
    expect(schema).toContain("attribution   Json?");
    expect(schema).toMatch(/dedupeKey\s+String\?\s+@unique/);
    expect(schema).toContain("@@index([name, createdAt])");
    const model = schema.slice(schema.indexOf("model FunnelEvent"), schema.indexOf("model ArticleCategory"));
    expect(model).not.toMatch(/email|phone|birth|referrer|rawPayload|metadata/i);
  });

  it("writes result only after chart persistence and keeps the anonymous session link", () => {
    expect(actions).toContain("recordChartResultFunnelEvent");
    expect(funnelEvents).toContain('name: "result"');
    expect(funnelEvents).toContain("anonymousSessionId: metadata.funnelSessionId");
    expect(actions.indexOf("saveChart(input, user, metadata)")).toBeLessThan(actions.indexOf("recordChartResultFunnelEvent(result.chart.id"));
  });

  it("writes account completion from trusted authentication paths", () => {
    expect(auth).toContain("recordAccountFunnelEvent");
    expect(googleCallback).toContain("recordAccountFunnelEvent");
    expect(magicRoute).toContain("recordAccountFunnelEvent");
    expect(actions).toContain("recordAttributedAccountFunnelEvent");
  });

  it("snapshots chart attribution and writes checkout only after an order exists", () => {
    expect(checkout).toContain("paymentFunnelAttribution");
    expect(checkout).toContain("attribution: attributionSnapshot");
    expect(checkout).toContain('name: "checkout"');
    expect(checkout.indexOf("paymentOrder.create")).toBeLessThan(checkout.indexOf('name: "checkout"'));
  });

  it("writes paid only from settlement and completion only after the reading is stored", () => {
    expect(payos).toContain('name: "paid"');
    expect(payos.indexOf("await completePaidReadingOrder")).toBeLessThan(payos.indexOf('name: "paid"'));
    expect(readingProcess).toContain('name: "reading_complete"');
    expect(readingProcess.indexOf("await completeReadingJob")).toBeLessThan(readingProcess.indexOf('name: "reading_complete"'));
  });
});
