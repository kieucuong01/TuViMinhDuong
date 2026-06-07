import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(fileURLToPath(new URL("../app/layout.tsx", import.meta.url)), "utf8");
const deferredModalsSource = readFileSync(fileURLToPath(new URL("./deferred-global-modals.tsx", import.meta.url)), "utf8");

describe("DeferredGlobalModals", () => {
  it("keeps heavy account and topup modal code out of the root layout bundle", () => {
    expect(layoutSource).toContain("DeferredGlobalModals");
    expect(layoutSource).not.toContain('from "@/components/coin-topup-modal"');
    expect(layoutSource).not.toContain('from "@/components/login-modal"');
  });

  it("loads modal components only when matching query params request them", () => {
    expect(deferredModalsSource).toContain('dynamic(() => import("@/components/coin-topup-modal")');
    expect(deferredModalsSource).toContain('dynamic(() => import("@/components/login-modal")');
    expect(deferredModalsSource).toContain('searchParams.get("topup") === "1"');
    expect(deferredModalsSource).toContain('searchParams.get("paywall") === "coins"');
    expect(deferredModalsSource).toContain('searchParams.get("login") === "1"');
  });
});
