import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const dataDirectory = path.join(projectRoot, "src", "lib", "data");

function read(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function importSpecifiers(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return sourceFile.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return [];
    return [statement.moduleSpecifier.text];
  });
}

describe("data module boundaries", () => {
  it("provides shared contracts and one process-wide demo store", () => {
    const contractsPath = path.join(dataDirectory, "contracts.ts");
    const demoStorePath = path.join(dataDirectory, "demo-store.ts");

    expect(fs.existsSync(contractsPath)).toBe(true);
    expect(fs.existsSync(demoStorePath)).toBe(true);

    const demoStoreSource = fs.readFileSync(demoStorePath, "utf8");
    expect(demoStoreSource.match(/globalThis/g)).toHaveLength(1);
    expect(demoStoreSource).not.toMatch(/^const\s+\w+\s*=\s*new Map/m);
  });

  it("keeps domain modules from importing back through the compatibility facade", () => {
    if (!fs.existsSync(dataDirectory)) throw new Error("src/lib/data directory is missing");
    const domainFiles = fs.readdirSync(dataDirectory)
      .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
      .map((name) => path.join(dataDirectory, name));

    for (const filePath of domainFiles) {
      expect(importSpecifiers(filePath), path.basename(filePath)).not.toContain("@/lib/data");
      expect(importSpecifiers(filePath), path.basename(filePath)).not.toContain("../data");
    }
  });

  it("keeps the compatibility facade server-only", () => {
    expect(read("src/lib/data.ts").trimStart().startsWith('import "server-only";')).toBe(true);
  });
});
