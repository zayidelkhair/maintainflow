import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach } from "vitest";
import { runSecurityScan } from "../src/commands/security.js";

describe("runSecurityScan", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "maintainflow-security-"));
    await mkdir(join(tempDir, "src"), { recursive: true });
  });

  it("detects hardcoded API keys", async () => {
    await writeFile(
      join(tempDir, "src", "config.ts"),
      'const key = "sk-abcdefghijklmnopqrstuvwxyz123456";\n'
    );

    const report = await runSecurityScan(tempDir, { json: true });
    expect(report.summary.critical).toBeGreaterThan(0);
    expect(report.findings.some((f) => f.title.includes("OpenAI"))).toBe(true);
  });

  it("detects eval usage", async () => {
    await writeFile(join(tempDir, "src", "unsafe.js"), "eval(userInput);\n");

    const report = await runSecurityScan(tempDir, { json: true });
    expect(report.findings.some((f) => f.title.includes("eval"))).toBe(true);
  });

  it("returns clean report for safe code", async () => {
    await writeFile(
      join(tempDir, "src", "safe.ts"),
      'export const greet = (name: string) => `Hello, ${name}`;\n'
    );

    const report = await runSecurityScan(tempDir, { json: true });
    expect(report.summary.critical).toBe(0);
    expect(report.findings.filter((f) => f.severity === "critical")).toHaveLength(0);
  });
});