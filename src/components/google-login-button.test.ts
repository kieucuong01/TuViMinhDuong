import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GoogleLoginButton } from "@/components/google-login-button";

const loginPageSource = readFileSync(fileURLToPath(new URL("../app/dang-nhap/page.tsx", import.meta.url)), "utf8");
const loginModalSource = readFileSync(fileURLToPath(new URL("./login-modal.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("GoogleLoginButton", () => {
  it("renders a recognizable Google sign-in button", () => {
    const html = renderToStaticMarkup(createElement(GoogleLoginButton, { href: "/api/oauth/google/start?next=%2F" }));

    expect(html).toContain('class="google-login-button"');
    expect(html).toContain("Tiếp tục với Google");
    expect(html).toContain('fill="#4285F4"');
    expect(html).toContain('fill="#34A853"');
    expect(html).toContain('fill="#FBBC05"');
    expect(html).toContain('fill="#EA4335"');
  });

  it("is used on both login surfaces", () => {
    expect(loginPageSource).toContain("GoogleLoginButton");
    expect(loginModalSource).toContain("GoogleLoginButton");
    expect(loginPageSource).not.toContain("btn btn-ghost mt-3 w-full");
    expect(loginModalSource).not.toContain("btn btn-ghost mt-3 w-full");
  });

  it("uses a neutral Google-style visual treatment", () => {
    expect(globalsCss).toMatch(/\.google-login-button\s*{[\s\S]*border:\s*1px solid #dadce0/);
    expect(globalsCss).toMatch(/\.google-login-button\s*{[\s\S]*background:\s*#fff/);
    expect(globalsCss).toMatch(/\.google-login-icon\s*{[\s\S]*width:\s*1\.35rem/);
  });
});
