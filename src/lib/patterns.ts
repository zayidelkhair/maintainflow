import type { Severity } from "../types.js";

export interface ScanPattern {
  id: string;
  pattern: RegExp;
  title: string;
  severity: Severity;
  recommendation: string;
}

export const SECRET_PATTERNS: ScanPattern[] = [
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

export const VULNERABILITY_PATTERNS: ScanPattern[] = [
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

/** Paths excluded from security scans (pattern definitions, tests with fixtures). */
export const SECURITY_SCAN_EXCLUSIONS = [
  /[/\\]src[/\\]lib[/\\]patterns\.ts$/,
  /[/\\]tests[/\\]/,
  /[/\\]dist[/\\]/,
  /[/\\]node_modules[/\\]/,
];