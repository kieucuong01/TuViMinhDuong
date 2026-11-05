import { afterEach, expect, it, vi } from "vitest";
import { requireQuanMonasterySeat } from "./tu-vi-quan-seat";

vi.mock("server-only", () => ({}));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("checks the guest's real seat over loopback and rejects missing seats and offline presence", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("AUTH_SECRET", "test-seat-key");
  const fetcher = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  await requireQuanMonasterySeat("private-cookie-id");
  const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toMatch(/^http:\/\/127\.0\.0\.1:4001\/monastery-seat\/[A-Za-z0-9_-]{22}$/);
  expect(url).not.toContain("private-cookie-id");
  expect(options.headers).toHaveProperty("Authorization", expect.stringMatching(/^Bearer /));
  fetcher.mockResolvedValueOnce(new Response("{}", { status: 409 }));
  await expect(requireQuanMonasterySeat("private-cookie-id")).rejects.toMatchObject({ status: 409 });
  fetcher.mockRejectedValueOnce(new Error("offline"));
  await expect(requireQuanMonasterySeat("private-cookie-id")).rejects.toMatchObject({ status: 503 });
});
