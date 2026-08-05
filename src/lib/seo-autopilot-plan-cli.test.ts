import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { afterEach, describe, expect, it } from "vitest";
import { rankTopicOpportunities } from "../../scripts/seo/seo-autopilot-core.mjs";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

function runPlanner(args: string[]) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/seo/seo-autopilot-plan.mjs", ...args], {
      cwd: process.cwd(),
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

describe("SEO Autopilot planner CLI", () => {
  it("prints a useful blocked report when no distinct article opportunity remains", async () => {
    const opportunitySlugs = rankTopicOpportunities([]).map((item) => item.slug);
    const server = createServer((request, response) => {
      const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      if (request.url === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" });
        response.end("User-agent: *\nAllow: /");
        return;
      }
      if (request.url === "/sitemap.xml") {
        const urls = opportunitySlugs.map((slug) => `<url><loc>${origin}/kien-thuc-tu-vi/${slug}</loc></url>`).join("");
        response.writeHead(200, { "content-type": "application/xml" });
        response.end(`<urlset>${urls}</urlset>`);
        return;
      }
      response.writeHead(200, { "content-type": "text/html" });
      response.end(`<html><head><title>Test</title><meta name="description" content="Test page"><link rel="canonical" href="${origin}${request.url || "/"}"></head><body><h1>Test</h1></body></html>`);
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address() as { port: number };

    const result = await runPlanner([
      "--base-url",
      `http://127.0.0.1:${address.port}`,
      "--skip-search-console",
      "--sample-size",
      "1",
      "--articles",
      "1",
    ]);

    expect(result.code, result.stderr).toBe(0);
    expect(result.stdout).toContain("Status: blocked");
    expect(result.stdout).toContain("No safe new SEO article opportunities remain");
    expect(result.stdout).toContain("Weekly Content Plan");
  });
});
