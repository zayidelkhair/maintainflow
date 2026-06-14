import { listSourceFiles, readTextFile } from "../lib/fs.js";
import { printSecurityReport } from "../lib/report.js";
import type { Finding, SecurityReport, Severity } from "../types.js";

const SECRET_PATTERNS: Array<{
  id: string;
  pattern: RegExp;
  title: string;
  severity: Severity;
  recommendation: string;
}> = [
  {
    id: "aws-key",
    pattern: /AKIA[0-9A-Z]{16}/,
    title: "Possible AWS access key",
    severity: "critical",
    recommendation: "Rotate the key immediately and use environment variables or a secrets manager.",
  },
  {
    id: "openai-key",
    pattern: /sk-[a-zA-Z0-9]{20,}/,
    title: "Possible OpenAI API key",
    severity: "critical",
    recommendation: "Revoke the key at platform.openai.com and store secrets in CI/CD vaults.",
  },
  {
    id: "github-token",
    pattern: /ghp_[a-zA-Z0-9]{36,}/,
    title: "Possible GitHub personal access token",
    severity: "critical",
    recommendation: "Revoke the token and use GitHub Actions secrets or OIDC.",
  },
  {
    id: "private-key",
    pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    title: "Private key in source",
    severity: "critical",
    recommendation: "Remove the key from the repo, rotate credentials, and add the file pattern to .gitignore.",
  },
  {
    id: "generic-secret",
    pattern: /(?:password|passwd|secret|api[_-]?key|auth[_-]?token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    title: "Hardcoded credential",
    severity: "high",
    recommendation: "Move secrets to environment variables and scan git history with git-secrets or trufflehog.",
  },
  {
    id: "jwt",
    pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
    title: "Possible JWT token",
    severity: "high",
    recommendation: "Ensure tokens are not committed; use short-lived tokens in CI only.",
  },
];

const VULNERABILITY_PATTERNS: Array<{
  id: string;
  pattern: RegExp;
  title: string;
  severity: Severity;
  recommendation: string;
}> = [
  {
    id: "eval",
    pattern: /\beval\s*\(/,
    title: "Use of eval()",
    severity: "high",
    recommendation: "Avoid eval; use safer parsing alternatives.",
  },
  {
    id: "innerhtml",
    pattern: /\.innerHTML\s*=/,
    title: "Direct innerHTML assignment",
    severity: "medium",
    recommendation: "Use textContent or a sanitization library to prevent XSS.",
  },
  {
    id: "dangerously-set",
    pattern: /dangerouslySetInnerHTML/,
    title: "React dangerouslySetInnerHTML",
    severity: "medium",
    recommendation: "Sanitize HTML input with DOMPurify before rendering.",
  },
  {
    id: "sql-concat",
    pattern: /(?:query|execute)\s*\(\s*[`'"].*\$\{/,
    title: "Possible SQL injection via string interpolation",
    severity: "high",
    recommendation: "Use parameterized queries or an ORM.",
  },
  {
    id: "child-process",
    pattern: /child_process\.(?:exec|spawn)\s*\([^)]*\+/,
    title: "Shell command built with concatenation",
    severity: "high",
    recommendation: "Use execFile with argument arrays instead of shell string concatenation.",
  },
];

function emptySummary(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

export async function runSecurityScan(
  root: string,
  options: { json?: boolean; maxFiles?: number } = {}
): Promise<SecurityReport> {
  const files = await listSourceFiles(root);
  const maxFiles = options.maxFiles ?? 500;
  const scanned = files.slice(0, maxFiles);
  const findings: Finding[] = [];

  for (const file of scanned) {
    const content = await readTextFile(file);
    if (!content) continue;

    const relativePath = file.replace(root, "").replace(/^[/\\]/, "");

    for (const rule of SECRET_PATTERNS) {
      if (rule.pattern.test(content)) {
        findings.push({
          id: `${rule.id}-${relativePath}`,
          title: rule.title,
          description: `Pattern matched in ${relativePath}`,
          severity: rule.severity,
          file: relativePath,
          recommendation: rule.recommendation,
        });
      }
    }

    for (const rule of VULNERABILITY_PATTERNS) {
      if (rule.pattern.test(content)) {
        findings.push({
          id: `${rule.id}-${relativePath}`,
          title: rule.title,
          description: `Potentially unsafe pattern in ${relativePath}`,
          severity: rule.severity,
          file: relativePath,
          recommendation: rule.recommendation,
        });
      }
    }

    if (relativePath.includes(".env") && !relativePath.endsWith(".example")) {
      findings.push({
        id: `env-file-${relativePath}`,
        title: "Environment file committed",
        description: `${relativePath} may contain secrets.`,
        severity: "critical",
        file: relativePath,
        recommendation: "Remove from git, add to .gitignore, and provide .env.example instead.",
      });
    }
  }

  const lockfile = files.find((f) => f.endsWith("package-lock.json") || f.endsWith("pnpm-lock.yaml"));
  if (!lockfile && files.some((f) => f.endsWith("package.json"))) {
    findings.push({
      id: "no-lockfile",
      title: "Missing lockfile",
      description: "No package-lock.json or pnpm-lock.yaml found.",
      severity: "medium",
      recommendation: "Commit a lockfile to ensure reproducible and auditable dependency installs.",
    });
  }

  const summary = emptySummary();
  for (const f of findings) {
    summary[f.severity] += 1;
  }

  const report: SecurityReport = {
    scannedFiles: scanned.length,
    findings,
    summary,
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printSecurityReport(report);
  }

  return report;
}