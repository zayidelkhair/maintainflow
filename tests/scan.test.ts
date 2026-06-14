import { describe, it, expect } from "vitest";
import { scanContentForPatterns, detectHighEntropySecrets } from "../src/lib/scan.js";
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

describe("detectHighEntropySecrets", () => {
  it("flags high-entropy value assigned to secret-like var", () => {
    const content = 'const apiKey = "aGVsbG8tdGhpcy1pcy1hLXZlcnktbG9uZy1yYW5kb20tc2VjcmV0LXRva2VuLXZhbHVlMTIzNDU2Nzg=";\n';
    const findings = detectHighEntropySecrets(content, "config.ts");
    expect(findings.some((f) => f.title.includes("High-entropy secret"))).toBe(true);
  });

  it("flags long high-entropy literals", () => {
    const content = 'const x = "U2FsdGVkX1+veryhighentropystringthatlooksrandomenoughforasecretkeyhere123456789ABCDEF";\n';
    const findings = detectHighEntropySecrets(content, "keys.js");
    expect(findings.some((f) => f.title.includes("High-entropy string literal"))).toBe(true);
  });

  it("ignores low-entropy and short values", () => {
    const content = 'const token = "abc123"; const note = "just a regular sentence with some words";\n';
    const findings = detectHighEntropySecrets(content, "safe.ts");
    expect(findings).toHaveLength(0);
  });
});
