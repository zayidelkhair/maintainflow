import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runHealthAudit } from "../src/commands/health.js";
import { calculateHealthScore } from "../src/lib/score.js";
import { scoreToGrade } from "../src/lib/report.js";
import type { HealthCheck } from "../src/types.js";

describe("calculateHealthScore", () => {
  it("returns 100 when all checks pass", () => {
    const checks: HealthCheck[] = [
      { id: "a", name: "A", passed: true, weight: 50, message: "ok" },
      { id: "b", name: "B", passed: true, weight: 50, message: "ok" },
    ];
    expect(calculateHealthScore(checks)).toBe(100);
  });

  it("returns partial score when some checks fail", () => {
    const checks: HealthCheck[] = [
      { id: "a", name: "A", passed: true, weight: 50, message: "ok" },
      { id: "b", name: "B", passed: false, weight: 50, message: "fail" },
    ];
    expect(calculateHealthScore(checks)).toBe(50);
  });
});

describe("scoreToGrade", () => {
  it("maps scores to letter grades", () => {
    expect(scoreToGrade(95)).toBe("A");
    expect(scoreToGrade(85)).toBe("B");
    expect(scoreToGrade(75)).toBe("C");
    expect(scoreToGrade(65)).toBe("D");
    expect(scoreToGrade(40)).toBe("F");
  });
});

describe("runHealthAudit", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "maintainflow-health-"));
  });

  afterEach(async () => {
    // temp cleanup handled by OS
  });

  it("detects missing essential files", async () => {
    const report = await runHealthAudit(tempDir, true, true);
    expect(report.score).toBeLessThan(50);
    expect(report.findings.some((f) => f.id.includes("README"))).toBe(true);
  });

  it("scores higher with essential files present", async () => {
    await writeFile(join(tempDir, "README.md"), "# Test Project\n");
    await writeFile(join(tempDir, "LICENSE"), "MIT\n");
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "test", scripts: { test: "vitest" }, repository: "github.com/test" })
    );
    await mkdir(join(tempDir, ".github", "workflows"), { recursive: true });
    await writeFile(join(tempDir, ".github", "workflows", "ci.yml"), "name: ci\n");

    const report = await runHealthAudit(tempDir, true, true);
    expect(report.score).toBeGreaterThan(40);
    expect(report.checks.find((c) => c.id === "README.md")?.passed).toBe(true);
  });
});