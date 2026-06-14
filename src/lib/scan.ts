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

/** Simple Shannon entropy for a string. Higher => more random (possible secret). */
function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const c in freq) {
    const p = freq[c] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

const SECRET_VAR_RE = /(?:api[_-]?key|secret|token|auth[_-]?token|password|passwd|private[_-]?key|access[_-]?key|credential)\s*[:=]\s*['"`]?([A-Za-z0-9/+=._-]{20,})['"`]?/i;
const LONG_B64_LIKE = /[A-Za-z0-9/+=._-]{32,}/g;

export function detectHighEntropySecrets(content: string, relativePath: string): Finding[] {
  // Skip lockfiles — they contain many high-entropy hashes by design (npm/yarn/pnpm integrity)
  if (/package-lock\.json|yarn\.lock|pnpm-lock\.yaml$/i.test(relativePath)) {
    return [];
  }

  const lines = content.split("\n");
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for assignment to secret-like var with long value
    const varMatch = SECRET_VAR_RE.exec(line);
    if (varMatch && varMatch[1]) {
      const candidate = varMatch[1];
      if (candidate.length >= 20 && !seen.has(`${relativePath}:${i}`)) {
        const ent = calculateEntropy(candidate);
        if (ent >= 4.2) {
          seen.add(`${relativePath}:${i}`);
          findings.push({
            id: `high-entropy-secret-${relativePath}-${i + 1}`,
            title: "High-entropy secret-like value",
            description: `High entropy (${ent.toFixed(1)}) value assigned to sensitive variable at line ${i + 1}`,
            severity: "high",
            file: relativePath,
            line: i + 1,
            recommendation: "Move this value to environment variables or a secrets manager. Rotate if real.",
          });
        }
      }
    }

    // Catch long standalone base64-ish literals that have high entropy (potential raw secrets)
    let m: RegExpExecArray | null;
    LONG_B64_LIKE.lastIndex = 0;
    while ((m = LONG_B64_LIKE.exec(line)) !== null) {
      const candidate = m[0];
      if (candidate.length >= 40) {
        const ent = calculateEntropy(candidate);
        if (ent >= 4.5 && !seen.has(`${relativePath}:${i}:${m.index}`)) {
          seen.add(`${relativePath}:${i}:${m.index}`);
          findings.push({
            id: `high-entropy-literal-${relativePath}-${i + 1}-${m.index}`,
            title: "High-entropy string literal (possible secret)",
            description: `Long high-entropy string (entropy ${ent.toFixed(1)}) at line ${i + 1}`,
            severity: "medium",
            file: relativePath,
            line: i + 1,
            recommendation: "Audit this value. If sensitive, remove from source and use a secret store.",
          });
        }
      }
    }
  }

  return findings;
}
