import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearClientSessionCache, fetchClientSession } from "@/components/client-user-session";

const headerSource = readFileSync(fileURLToPath(new URL("./user-header-badge.tsx", import.meta.url)), "utf8");
const footerPolicySource = readFileSync(fileURLToPath(new URL("./footer-account-policy-link.tsx", import.meta.url)), "utf8");

describe("client user session cache", () => {
  afterEach(() => {
    clearClientSessionCache();
    vi.restoreAllMocks();
  });

  it("dedupes simultaneous account lookups on the same page load", async () => {
    const fetchMock = vi.fn(async () => Response.json({ user: { id: "u1", email: "a@example.com", name: "A", role: "USER", coinBalance: 3 } }));
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([fetchClientSession(), fetchClientSession()]);

    expect(first.user?.email).toBe("a@example.com");
    expect(second.user?.coinBalance).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/me", { credentials: "same-origin", cache: "no-store" });
  });

  it("lets route and focus refreshes force a fresh account lookup", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ user: null }))
      .mockResolvedValueOnce(Response.json({ user: { id: "u2", email: "b@example.com", name: "B", role: "ADMIN", coinBalance: 8 } }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchClientSession();
    const refreshed = await fetchClientSession({ force: true });

    expect(refreshed.user?.role).toBe("ADMIN");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("routes header and footer account checks through the shared helper", () => {
    expect(headerSource).toContain("fetchClientSession");
    expect(footerPolicySource).toContain("fetchClientSession");
    expect(headerSource).toContain("notifyClientSessionChanged");
    expect(headerSource).toContain("onClientSessionChanged");
    expect(footerPolicySource).toContain("onClientSessionChanged");
    expect(footerPolicySource).not.toContain('fetch("/api/me"');
  });
});
