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
  {
    id: "stripe-key",
    pattern: /sk_live_[a-zA-Z0-9]{20,}/,
    title: "Possible Stripe live secret key",
    severity: "critical",
    recommendation: "Revoke at dashboard.stripe.com and use Stripe webhook secrets via env vars.",
  },
  {
    id: "slack-token",
    pattern: /xox[baprs]-[a-zA-Z0-9-]{10,}/,
    title: "Possible Slack token",
    severity: "critical",
    recommendation: "Revoke the token in Slack app settings and use workspace secrets.",
  },
  {
    id: "npm-token",
    pattern: /npm_[a-zA-Z0-9]{36}/,
    title: "Possible npm access token",
    severity: "critical",
    recommendation: "Revoke at npmjs.com and use OIDC or npm provenance in CI.",
  },
  {
    id: "discord-token",
    pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/,
    title: "Possible Discord bot token",
    severity: "critical",
    recommendation: "Regenerate the bot token in the Discord developer portal.",
  },
  {
    id: "bearer-token",
    pattern: /Bearer\s+[a-zA-Z0-9._-]{20,}/,
    title: "Hardcoded bearer token",
    severity: "high",
    recommendation: "Use Authorization headers from environment, never hardcoded in source.",
  },
  {
    id: "azure-key",
    pattern: /(?:AccountKey|SharedAccessKey|DefaultEndpointsProtocol)[=:]\s*['"][^'"]{20,}['"]/i,
    title: "Possible Azure storage / access key",
    severity: "critical",
    recommendation: "Rotate the Azure key and use managed identity or Key Vault.",
  },
  {
    id: "google-api-key",
    pattern: /AIza[0-9A-Za-z\-_]{35}/,
    title: "Possible Google API key",
    severity: "critical",
    recommendation: "Restrict or revoke the key in Google Cloud console.",
  },
  {
    id: "slack-signing-secret",
    pattern: /xapp-[A-Z0-9]{1,}-[A-Z0-9]{1,}-[A-Za-z0-9]{1,}/,
    title: "Possible Slack signing secret / app token",
    severity: "critical",
    recommendation: "Regenerate app credentials and store via environment variables.",
  },
  {
    id: "gitlab-token",
    pattern: /glpat-[0-9a-zA-Z\-]{20,}/,
    title: "Possible GitLab personal access token",
    severity: "critical",
    recommendation: "Revoke the token and prefer CI/CD variables or OIDC.",
  },
  {
    id: "pem-private-key",
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
    title: "PEM private key block",
    severity: "critical",
    recommendation: "Never commit private keys. Use secrets management and rotate.",
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
  {
    id: "document-write",
    pattern: /document\.write\s*\(/,
    title: "Use of document.write()",
    severity: "medium",
    recommendation: "Avoid document.write; use DOM APIs to prevent XSS.",
  },
  {
    id: "insecure-random",
    pattern: /Math\.random\s*\(\s*\).*(?:token|secret|password|key)/i,
    title: "Math.random() used for security-sensitive value",
    severity: "high",
    recommendation: "Use crypto.randomBytes() or Web Crypto for security tokens.",
  },
];

/** Paths excluded from security scans (pattern definitions, tests with fixtures). */
export const SECURITY_SCAN_EXCLUSIONS = [
  /[/\\]src[/\\]lib[/\\]patterns\.ts$/,
  /[/\\]tests[/\\]/,
  /[/\\]dist[/\\]/,
  /[/\\]node_modules[/\\]/,
];