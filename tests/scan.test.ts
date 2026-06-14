import { describe, it, expect } from "vitest";
import { scanContentForPatterns } from "../src/lib/scan.js";
import type { ScanPattern } from "../src/lib/patterns.js";

const TEST_RULE: ScanPattern = {
  id: "test-secret",
  pattern: /sk-test-[a-z0-9]{8}/,
  title: "Test secret",
  severity: "critical",
  recommendation: "Remove it",
};

describe("scanContentForPatterns", () => {
  it("reports line numbers for matches", () => {
    const content = "const ok = true;\nconst bad = 'sk-test-abcdef12';\n";
    const findings = scanContentForPatterns(content, [TEST_RULE], "config.ts", "Matched");
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(2);
    expect(findings[0].file).toBe("config.ts");
  });

  it("returns empty for clean content", () => {
    const findings = scanContentForPatterns("export const x = 1;\n", [TEST_RULE], "safe.ts", "Matched");
    expect(findings).toHaveLength(0);
  });
});