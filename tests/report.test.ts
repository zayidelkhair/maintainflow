import { describe, it, expect } from "vitest";
import { formatAuditMarkdown, healthBadgeUrl, scoreToGrade } from "../src/lib/report.js";
import type { AuditReport } from "../src/types.js";

const SAMPLE: AuditReport = {
  generatedAt: "2026-06-14T00:00:00.000Z",
  health: {
    score: 95,
    grade: "A",
    checks: [{ id: "readme", name: "README", passed: true, weight: 15, message: "Present" }],
    findings: [],
  },
  security: {
    scannedFiles: 10,
    findings: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  },
};

describe("formatAuditMarkdown", () => {
  it("includes health score and badge", () => {
    const md = formatAuditMarkdown(SAMPLE);
    expect(md).toContain("95/100");
    expect(md).toContain("maintainflow_health");
  });
});

describe("healthBadgeUrl", () => {
  it("uses green for high scores", () => {
    expect(healthBadgeUrl(90)).toContain("brightgreen");
  });

  it("uses red for low scores", () => {
    expect(healthBadgeUrl(40)).toContain("red");
  });
});