import { afterEach, describe, expect, it, vi } from "vitest";

const originalDatabaseUrl = process.env.DATABASE_URL;

async function loadEnvWithDatabaseUrl(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = value;
  }
  return import("@/lib/env");
}

describe("database environment detection", () => {
  afterEach(() => {
    vi.resetModules();
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("marks missing and placeholder database URLs as non-production data sources", async () => {
    await expect(loadEnvWithDatabaseUrl(undefined).then((env) => env.databaseEnvState())).resolves.toBe("missing");
    await expect(
      loadEnvWithDatabaseUrl("postgresql://johndoe:randompassword@localhost:5432/ignore").then((env) => env.databaseEnvState()),
    ).resolves.toBe("placeholder");
  });

  it("marks a real-looking Postgres URL as configured", async () => {
    const env = await loadEnvWithDatabaseUrl("postgresql://app:secret@db.example.com:5432/tuvi");

    expect(env.databaseEnvState()).toBe("configured");
    expect(env.hasDatabaseUrl()).toBe(true);
  });
});
