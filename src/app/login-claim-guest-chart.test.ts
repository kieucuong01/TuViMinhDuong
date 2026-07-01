import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const actionsSource = readFileSync(fileURLToPath(new URL("./actions.ts", import.meta.url)), "utf8");
const googleCallbackSource = readFileSync(fileURLToPath(new URL("./api/oauth/google/callback/route.ts", import.meta.url)), "utf8");

describe("login chart ownership handoff", () => {
  it("claims the chart from the sanitized next path after password login succeeds", () => {
    expect(actionsSource).toContain("claimGuestChartForUserFromPath");
    expect(actionsSource).toContain("user = await loginOrRegister(email, password);");
    expect(actionsSource).toContain("await claimGuestChartForUserFromPath(next, user);");
  });

  it("claims the chart from the OAuth next path after Google login succeeds", () => {
    expect(googleCallbackSource).toContain("claimGuestChartForUserFromPath");
    expect(googleCallbackSource).toContain("await claimGuestChartForUserFromPath(parsed.next, user);");
    expect(googleCallbackSource).toContain("await setSession(user);");
  });
});
