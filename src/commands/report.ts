import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { loadConfig } from "../lib/config.js";
import { formatAuditMarkdown, healthBadgeUrl } from "../lib/report.js";
import { runHealthAudit } from "./health.js";
import { runSecurityScan } from "./security.js";
import { runTriage } from "./triage.js";
import type { AuditReport } from "../types.js";

export async function generateAuditReport(
  root: string,
  options: { json?: boolean; markdown?: boolean; output?: string; includeTriage?: boolean } = {}
): Promise<AuditReport> {
  const config = await loadConfig(root);

  const [health, security] = await Promise.all([
    runHealthAudit(root, false, true, config),
    runSecurityScan(root, { silent: true, maxFiles: config.security.maxFiles, config }),
  ]);

  let triage;
  if (options.includeTriage) {
    triage = await runTriage(root, true, true);
  }

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    health,
    security,
    triage,
  };

  if (options.json) {
    const output = JSON.stringify(report, null, 2);
    if (options.output) {
      await writeFile(options.output, output, "utf-8");
      console.log(chalk.green(`Report written to ${options.output}`));
    } else {
      console.log(output);
    }
    return report;
  }

  if (options.markdown) {
    const md = formatAuditMarkdown(report);
    if (options.output) {
      await writeFile(options.output, md, "utf-8");
      console.log(chalk.green(`Report written to ${options.output}`));
    } else {
      console.log(md);
    }
    return report;
  }

  // Default: print summary + badge hint
  console.log();
  console.log(chalk.bold("Audit Summary"));
  console.log(chalk.dim("─".repeat(40)));
  console.log(`Health: ${health.score}/100 (${health.grade})`);
  console.log(
    `Security: ${security.summary.critical} critical, ${security.summary.high} high, ${security.summary.medium} medium`
  );
  console.log();
  console.log(chalk.dim("README badge:"));
  console.log(
    `![maintainflow health](${healthBadgeUrl(health.score)})`
  );
  console.log();
  console.log(chalk.dim("Tip: use --markdown --output AUDIT.md for a full report"));
  console.log();

  return report;
}

export async function writeDefaultReport(root: string): Promise<string> {
  const output = join(root, "AUDIT.md");
  await generateAuditReport(root, { markdown: true, output, includeTriage: true });
  return output;
}