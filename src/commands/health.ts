import { join } from "node:path";
import { pathExists, readTextFile } from "../lib/fs.js";
import {
  getContributorCount,
  getLastCommitDate,
  getRemoteUrl,
  isGitRepo,
} from "../lib/git.js";
import { printHealthReport, scoreToGrade } from "../lib/report.js";
import { calculateHealthScore } from "../lib/score.js";
import type { Finding, HealthCheck, HealthReport } from "../types.js";

const ESSENTIAL_FILES = [
  { path: "README.md", name: "README", weight: 15 },
  { path: "LICENSE", name: "License", weight: 10 },
  { path: "CONTRIBUTING.md", name: "Contributing guide", weight: 8 },
  { path: ".github/workflows/ci.yml", name: "CI workflow", weight: 12 },
  { path: ".github/ISSUE_TEMPLATE", name: "Issue templates", weight: 5, isDir: true },
  { path: "CODE_OF_CONDUCT.md", name: "Code of conduct", weight: 5 },
  { path: "SECURITY.md", name: "Security policy", weight: 8 },
];

export async function runHealthAudit(
  root: string,
  json = false,
  silent = false
): Promise<HealthReport> {
  const checks: HealthCheck[] = [];
  const findings: Finding[] = [];

  for (const file of ESSENTIAL_FILES) {
    const fullPath = join(root, file.path);
    const exists = file.isDir ? await pathExists(fullPath) : await pathExists(fullPath);
    checks.push({
      id: file.path,
      name: file.name,
      passed: exists,
      weight: file.weight,
      message: exists ? "Present" : "Missing",
    });

    if (!exists) {
      findings.push({
        id: `missing-${file.path}`,
        title: `Missing ${file.name}`,
        description: `${file.path} was not found in the repository.`,
        severity: file.weight >= 10 ? "high" : "medium",
        file: file.path,
        recommendation: `Add a ${file.name.toLowerCase()} to improve maintainer and contributor experience.`,
      });
    }
  }

  const hasGit = await isGitRepo(root);
  checks.push({
    id: "git",
    name: "Git repository",
    passed: hasGit,
    weight: 10,
    message: hasGit ? "Initialized" : "Not a git repo",
  });

  if (hasGit) {
    const remote = await getRemoteUrl(root);
    checks.push({
      id: "remote",
      name: "Remote origin",
      passed: !!remote,
      weight: 5,
      message: remote ?? "No origin remote configured",
    });

    const lastCommit = await getLastCommitDate(root);
    const daysSinceCommit = lastCommit
      ? Math.floor((Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const active = daysSinceCommit !== null && daysSinceCommit <= 90;
    checks.push({
      id: "activity",
      name: "Recent activity",
      passed: active,
      weight: 10,
      message:
        daysSinceCommit === null
          ? "Unable to determine"
          : active
            ? `Last commit ${daysSinceCommit} days ago`
            : `Stale — last commit ${daysSinceCommit} days ago`,
    });

    if (!active && daysSinceCommit !== null) {
      findings.push({
        id: "stale-repo",
        title: "Repository appears inactive",
        description: `No commits in the last ${daysSinceCommit} days.`,
        severity: "medium",
        recommendation: "Regular commits signal an actively maintained project to contributors.",
      });
    }

    const contributors = await getContributorCount(root);
    checks.push({
      id: "contributors",
      name: "Contributors",
      passed: contributors >= 1,
      weight: 5,
      message: `${contributors} contributor(s)`,
    });
  }

  const pkgContent = await readTextFile(join(root, "package.json"));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent) as {
        scripts?: Record<string, string>;
        repository?: unknown;
      };
      const hasTestScript = Boolean(pkg.scripts?.test);
      checks.push({
        id: "tests",
        name: "Test script",
        passed: hasTestScript,
        weight: 10,
        message: hasTestScript ? "Defined in package.json" : "No test script found",
      });

      if (!hasTestScript) {
        findings.push({
          id: "no-tests",
          title: "No test script defined",
          description: "package.json has no test script.",
          severity: "medium",
          file: "package.json",
          recommendation: 'Add a "test" script (e.g. vitest, jest, or node --test).',
        });
      }

      const hasRepo = Boolean(pkg.repository);
      checks.push({
        id: "pkg-repo",
        name: "Package repository field",
        passed: hasRepo,
        weight: 5,
        message: hasRepo ? "Configured" : "Missing repository field",
      });
    } catch {
      findings.push({
        id: "invalid-package-json",
        title: "Invalid package.json",
        description: "package.json could not be parsed.",
        severity: "high",
        file: "package.json",
      });
    }
  }

  const score = calculateHealthScore(checks);
  const report: HealthReport = {
    score,
    grade: scoreToGrade(score),
    checks,
    findings,
  };

  if (!silent) {
    if (json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHealthReport(report);
    }
  }

  return report;
}