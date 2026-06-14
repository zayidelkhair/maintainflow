import { listSourceFiles, readTextFile } from "../lib/fs.js";
import {
  SECRET_PATTERNS,
  SECURITY_SCAN_EXCLUSIONS,
  VULNERABILITY_PATTERNS,
} from "../lib/patterns.js";
import { printSecurityReport } from "../lib/report.js";
import type { Finding, SecurityReport, Severity } from "../types.js";

function emptySummary(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function isExcluded(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return SECURITY_SCAN_EXCLUSIONS.some((pattern) => pattern.test(normalized));
}

export async function runSecurityScan(
  root: string,
  options: { json?: boolean; maxFiles?: number; silent?: boolean } = {}
): Promise<SecurityReport> {
  const allFiles = await listSourceFiles(root);
  const files = allFiles.filter((f) => !isExcluded(f));
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

  const lockfile = allFiles.find(
    (f) => f.endsWith("package-lock.json") || f.endsWith("pnpm-lock.yaml")
  );
  if (!lockfile && allFiles.some((f) => f.endsWith("package.json"))) {
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

  if (!options.silent) {
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printSecurityReport(report);
    }
  }

  return report;
}