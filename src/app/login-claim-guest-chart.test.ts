import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const actionsSource = readFileSync(fileURLToPath(new URL("./actions.ts", import.meta.url)), "utf8");
const googleCallbackSource = readFileSync(fileURLToPath(new URL("./api/oauth/google/callback/route.ts", import.meta.url)), "utf8");
const loginActionSource = actionsSource.slice(
  actionsSource.indexOf("export async function loginAction"),
  actionsSource.indexOf("export async function logoutAction"),
);

describe("login chart ownership handoff", () => {
  it("claims the chart from the sanitized next path after password login succeeds", () => {
    expect(actionsSource).toContain("claimGuestChartForUserFromPath");
    expect(loginActionSource).toContain("loginResult = await loginOrRegister(email, password);");
    expect(loginActionSource).toContain("claimed = await claimGuestChartForUserFromPath(next, loginResult.user);");
    expect(loginActionSource).toContain("account: loginResult.accountResult");
    expect(loginActionSource).toContain('claimed: claimed ? "1" : null');

    const authFailureBranch = loginActionSource.indexOf("if (!loginResult)");
    expect(authFailureBranch).toBeGreaterThan(0);
    expect(loginActionSource.slice(0, authFailureBranch)).not.toContain("redirect(");
  });

  it("claims the chart from the OAuth next path after Google login succeeds", () => {
    expect(googleCallbackSource).toContain("claimGuestChartForUserFromPath");
    expect(googleCallbackSource).toContain("const existingUser = await db.user.findUnique");
    expect(googleCallbackSource).toContain('accountResult = existingUser ? "login" : "register"');
    expect(googleCallbackSource).toContain("claimed = await claimGuestChartForUserFromPath(parsed.next, user);");
    expect(googleCallbackSource).toContain('successUrl.searchParams.set("account", accountResult)');
    expect(googleCallbackSource).toContain('if (claimed) successUrl.searchParams.set("claimed", "1")');
    expect(googleCallbackSource).toContain("await setSession(user);");
  });
});
