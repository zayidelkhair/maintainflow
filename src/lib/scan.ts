import type { ScanPattern } from "./patterns.js";
import type { Finding } from "../types.js";

export function scanContentForPatterns(
  content: string,
  rules: ScanPattern[],
  relativePath: string,
  descriptionPrefix: string
): Finding[] {
  const lines = content.split("\n");
  const findings: Finding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        findings.push({
          id: `${rule.id}-${relativePath}-${i + 1}`,
          title: rule.title,
          description: `${descriptionPrefix} at line ${i + 1}`,
          severity: rule.severity,
          file: relativePath,
          line: i + 1,
          recommendation: rule.recommendation,
        });
      }
    }
  }

  return findings;
}