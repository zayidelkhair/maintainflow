#!/usr/bin/env node

import { resolve } from "node:path";
import { Command } from "commander";
import { generateAgentsMd } from "./commands/agents-md.js";
import { runHealthAudit } from "./commands/health.js";
import { markReleaseItem, runReleaseChecklist } from "./commands/release.js";
import { runSecurityScan } from "./commands/security.js";
import { runTriage } from "./commands/triage.js";

const program = new Command();

program
  .name("maintainflow")
  .description("Open-source maintainer toolkit for health audits, security, triage, and releases")
  .version("0.1.0");

program
  .command("health")
  .description("Audit repository health and maintainer readiness")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .action(async (opts: { path: string; json?: boolean }) => {
    const root = resolve(opts.path);
    const report = await runHealthAudit(root, opts.json);
    if (!opts.json && report.score < 60) process.exit(1);
  });

program
  .command("security")
  .description("Scan for secrets, credentials, and common vulnerability patterns")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .option("--max-files <n>", "Maximum files to scan", "500")
  .action(async (opts: { path: string; json?: boolean; maxFiles: string }) => {
    const root = resolve(opts.path);
    const report = await runSecurityScan(root, {
      json: opts.json,
      maxFiles: parseInt(opts.maxFiles, 10),
    });
    if (!opts.json && report.summary.critical > 0) process.exit(1);
  });

program
  .command("triage")
  .description("Prioritize open GitHub issues and pull requests")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .action(async (opts: { path: string; json?: boolean }) => {
    const root = resolve(opts.path);
    await runTriage(root, opts.json);
  });

program
  .command("release")
  .description("Generate and track a release checklist")
  .option("-p, --path <path>", "Repository path", ".")
  .option("-v, --version <version>", "Target release version")
  .option("--json", "Output as JSON")
  .option("--save", "Save checklist to .maintainflow-release.json")
  .action(async (opts: { path: string; version?: string; json?: boolean; save?: boolean }) => {
    const root = resolve(opts.path);
    await runReleaseChecklist(root, {
      version: opts.version,
      json: opts.json,
      save: opts.save,
    });
  });

program
  .command("release-done <item>")
  .description("Mark a release checklist item as complete")
  .option("-p, --path <path>", "Repository path", ".")
  .action(async (item: string, opts: { path: string }) => {
    const root = resolve(opts.path);
    await markReleaseItem(root, item, true);
  });

program
  .command("agents-md")
  .description("Generate AGENTS.md for AI coding agent workflows")
  .option("-p, --path <path>", "Repository path", ".")
  .option("-o, --output <file>", "Output file path")
  .option("--dry-run", "Print to stdout instead of writing file")
  .action(async (opts: { path: string; output?: string; dryRun?: boolean }) => {
    const root = resolve(opts.path);
    await generateAgentsMd({
      root,
      output: opts.output,
      dryRun: opts.dryRun,
    });
  });

program
  .command("audit")
  .description("Run full maintainer audit (health + security)")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .action(async (opts: { path: string; json?: boolean }) => {
    const root = resolve(opts.path);
    const [health, security] = await Promise.all([
      runHealthAudit(root, opts.json),
      runSecurityScan(root, { json: opts.json }),
    ]);

    if (opts.json) {
      console.log(JSON.stringify({ health, security }, null, 2));
      return;
    }

    const failed =
      health.score < 60 || security.summary.critical > 0 || security.summary.high > 0;
    if (failed) process.exit(1);
  });

program.parse();