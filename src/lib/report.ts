import chalk from "chalk";
import type { Finding, HealthReport, SecurityReport, Severity } from "../types.js";

const SEVERITY_COLORS: Record<Severity, (text: string) => string> = {
  critical: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.gray,
};

export function printHealthReport(report: HealthReport): void {
  const gradeColor =
    report.score >= 80 ? chalk.green : report.score >= 60 ? chalk.yellow : chalk.red;

  console.log();
  console.log(chalk.bold("Repository Health Report"));
  console.log(chalk.dim("─".repeat(40)));
  console.log(`Score: ${gradeColor(`${report.score}/100`)}  Grade: ${gradeColor(report.grade)}`);
  console.log();

  for (const check of report.checks) {
    const icon = check.passed ? chalk.green("✓") : chalk.red("✗");
    console.log(`${icon} ${check.name}: ${check.message}`);
  }

  if (report.findings.length > 0) {
    console.log();
    console.log(chalk.bold("Recommendations"));
    for (const finding of report.findings) {
      const color = SEVERITY_COLORS[finding.severity];
      console.log(`  ${color(`[${finding.severity}]`)} ${finding.title}`);
      if (finding.recommendation) {
        console.log(chalk.dim(`    → ${finding.recommendation}`));
      }
    }
  }
  console.log();
}

export function printSecurityReport(report: SecurityReport): void {
  console.log();
  console.log(chalk.bold("Security Scan Report"));
  console.log(chalk.dim("─".repeat(40)));
  console.log(`Files scanned: ${report.scannedFiles}`);
  console.log(
    `Findings: ${chalk.red(String(report.summary.critical))} critical, ` +
      `${chalk.yellow(String(report.summary.high))} high, ` +
      `${chalk.blue(String(report.summary.medium))} medium`
  );
  console.log();

  if (report.findings.length === 0) {
    console.log(chalk.green("No security issues detected."));
    return;
  }

  for (const finding of report.findings) {
    const color = SEVERITY_COLORS[finding.severity];
    const location = finding.file ? chalk.dim(` (${finding.file})`) : "";
    console.log(`${color(`[${finding.severity}]`)} ${finding.title}${location}`);
    console.log(chalk.dim(`  ${finding.description}`));
    if (finding.recommendation) {
      console.log(chalk.cyan(`  Fix: ${finding.recommendation}`));
    }
  }
  console.log();
}

export function printFindings(title: string, findings: Finding[]): void {
  console.log();
  console.log(chalk.bold(title));
  console.log(chalk.dim("─".repeat(40)));

  if (findings.length === 0) {
    console.log(chalk.green("All clear."));
    return;
  }

  for (const finding of findings) {
    const color = SEVERITY_COLORS[finding.severity];
    console.log(`${color(`[${finding.severity}]`)} ${finding.title}`);
    if (finding.description) console.log(chalk.dim(`  ${finding.description}`));
  }
  console.log();
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}