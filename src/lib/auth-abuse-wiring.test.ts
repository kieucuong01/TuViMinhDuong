import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actions = readFileSync("src/app/actions.ts", "utf8");
const magicRoute = readFileSync("src/app/api/auth/magic/route.ts", "utf8");

describe("auth abuse wiring", () => {
  it("awaits the shared limiter before password verification", () => {
    const login = actions.slice(actions.indexOf("export async function loginAction"), actions.indexOf("export async function logoutAction"));
    expect(login).toContain('await checkAuthRateLimit("login", headerList');
    expect(login.indexOf("await checkAuthRateLimit")).toBeLessThan(login.indexOf("await loginOrRegister"));
  });

  it("awaits the shared limiter before consuming a magic token", () => {
    expect(magicRoute).toContain('await checkAuthRateLimit("magic", request.headers');
    expect(magicRoute.indexOf("await checkAuthRateLimit")).toBeLessThan(magicRoute.indexOf("await signInWithMagicToken"));
  });
});
