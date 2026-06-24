import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
) as { scripts?: Record<string, string> };
const releaseScript = readFileSync(
  fileURLToPath(new URL("../../scripts/release-production.ps1", import.meta.url)),
  "utf8",
);
const releaseGuide = readFileSync(
  fileURLToPath(new URL("../../docs/agent/manual-release.md", import.meta.url)),
  "utf8",
);

describe("production release command", () => {
  it("exposes one npm command for verify, commit, push, and deploy", () => {
    expect(packageJson.scripts?.["release:production"]).toContain("release-production.ps1");
    expect(releaseScript).toContain("npm run lint");
    expect(releaseScript).toContain("npm test");
    expect(releaseScript).toContain("npm run build");
    expect(releaseScript).toContain("git add --all");
    expect(releaseScript).toContain("git push origin master");
  });

  it("uses the VPS release symlink and verifies PM2 production state", () => {
    expect(releaseScript).toContain('APP_ROOT="/opt/lasotinhhoa"');
    expect(releaseScript).toContain('RELEASE_DIR="$APP_ROOT/releases/$RELEASE_NAME"');
    expect(releaseScript).toContain('CURRENT_DIR="$APP_ROOT/current"');
    expect(releaseScript).toContain("pm2 start node_modules/next/dist/bin/next");
    expect(releaseScript).toContain("pm2 describe lasotinhhoa");
    expect(releaseScript).toContain("https://lasotinhhoa.vn/kien-thuc-tu-vi");
  });

  it("documents the normal command and migration variant", () => {
    expect(releaseGuide).toContain('npm run release:production -- "feat: mô tả thay đổi"');
    expect(releaseGuide).toContain("-Migrate");
    expect(releaseGuide).toContain("git status --short");
  });
});
