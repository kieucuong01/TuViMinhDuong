import { describe, expect, it } from "vitest";
import { normalizeGoogleProfile, parseGoogleOAuthState, safeOAuthNextPath } from "@/lib/google-oauth";

describe("Google OAuth helpers", () => {
  it("keeps only safe relative next paths", () => {
    expect(safeOAuthNextPath("/la-so/abc?nang=1")).toBe("/la-so/abc?nang=1");
    expect(safeOAuthNextPath("https://evil.example")).toBe("/");
    expect(safeOAuthNextPath("//evil.example")).toBe("/");
    expect(safeOAuthNextPath("")).toBe("/");
  });

  it("parses stored state without throwing on malformed cookies", () => {
    expect(parseGoogleOAuthState(JSON.stringify({ state: "abc", next: "/admin" }))).toEqual({
      state: "abc",
      next: "/admin",
    });
    expect(parseGoogleOAuthState("{bad json")).toBeNull();
    expect(parseGoogleOAuthState(JSON.stringify({ state: 123, next: "/admin" }))).toBeNull();
  });

  it("requires a verified Google email when Google reports verification", () => {
    expect(normalizeGoogleProfile({ sub: "1", email: "USER@Example.COM", email_verified: true })).toMatchObject({
      providerAccountId: "1",
      email: "user@example.com",
    });
    expect(normalizeGoogleProfile({ sub: "1", email: "user@example.com", email_verified: false })).toBeNull();
    expect(normalizeGoogleProfile({ sub: "", email: "user@example.com", email_verified: true })).toBeNull();
  });
});
