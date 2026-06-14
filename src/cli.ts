#!/usr/bin/env node

import { resolve } from "node:path";
import { Command } from "commander";
import { generateAgentsMd } from "./commands/agents-md.js";
import { generateChangelog, formatChangelogMarkdown } from "./commands/changelog.js";
import { runHealthAudit } from "./commands/health.js";
import { runInit } from "./commands/init.js";
import { markReleaseItem, runReleaseChecklist } from "./commands/release.js";
import { generateAuditReport } from "./commands/report.js";
import { runReview, printReview } from "./commands/review.js";
import { runSecurityScan } from "./commands/security.js";
import { runTriage } from "./commands/triage.js";
import { loadConfig } from "./lib/config.js";
import { writeFile } from "node:fs/promises";

const program = new Command();

program
  .name("maintainflow")
  .description("Open-source maintainer toolkit for health audits, security, triage, and releases")
  .version("0.3.0");

program
  .command("health")
  .description("Audit repository health and maintainer readiness")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .action(async (opts: { path: string; json?: boolean }) => {
    const root = resolve(opts.path);
    const config = await loadConfig(root);
    const report = await runHealthAudit(root, opts.json, false, config);
    if (!opts.json && report.score < config.minHealthScore) process.exit(1);
  });

program
  .command("security")
  .description("Scan for secrets, credentials, and common vulnerability patterns")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .option("--max-files <n>", "Maximum files to scan")
  .action(async (opts: { path: string; json?: boolean; maxFiles?: string }) => {
    const root = resolve(opts.path);
    const config = await loadConfig(root);
    const report = await runSecurityScan(root, {
      json: opts.json,
      maxFiles: opts.maxFiles ? parseInt(opts.maxFiles, 10) : undefined,
      config,
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
  .command("review")
  .description("Generate Codex-ready review prompts and analysis for recent changes or a PR")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--pr <number>", "Review a specific PR number (requires gh)")
  .option("--commit <ref>", "Review a specific commit or range (e.g. HEAD~1)")
  .option("--json", "Output as JSON")
  .action(async (opts: { path: string; pr?: string; commit?: string; json?: boolean }) => {
    const root = resolve(opts.path);
    if (opts.json) {
      const result = await runReview(root, { path: root, pr: opts.pr, commit: opts.commit, json: true });
      console.log(JSON.stringify(result, null, 2));
    } else {
      await printReview(root, { path: root, pr: opts.pr, commit: opts.commit });
    }
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
  .command("init")
  .description("Bootstrap OSS maintainer files (SECURITY.md, CI, dependabot, config)")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--force", "Overwrite existing files")
  .option("--dry-run", "Show what would be created")
  .action(async (opts: { path: string; force?: boolean; dryRun?: boolean }) => {
    const root = resolve(opts.path);
    await runInit(root, { force: opts.force, dryRun: opts.dryRun });
  });

program
  .command("changelog")
  .description("Generate changelog from git commits")
  .option("-p, --path <path>", "Repository path", ".")
  .option("-v, --version <version>", "Release version")
  .option("--since <ref>", "Git ref to start from (default: latest tag)")
  .option("--json", "Output as JSON")
  .option("--markdown", "Output as markdown")
  .option("-o, --output <file>", "Write to file")
  .action(async (opts: {
    path: string;
    version?: string;
    since?: string;
    json?: boolean;
    markdown?: boolean;
    output?: string;
  }) => {
    const root = resolve(opts.path);
    const report = await generateChangelog(root, {
      version: opts.version,
      since: opts.since,
      json: opts.json,
      silent: opts.markdown || Boolean(opts.output),
    });

    if (opts.markdown || (opts.output && !opts.json)) {
      const md = formatChangelogMarkdown(report);
      if (opts.output) {
        await writeFile(opts.output, md, "utf-8");
        console.log(`Changelog written to ${opts.output}`);
      } else {
        console.log(md);
      }
    }
  });

program
  .command("report")
  .description("Generate a full audit report (health + security + optional triage)")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .option("--markdown", "Output as markdown")
  .option("-o, --output <file>", "Write report to file")
  .option("--triage", "Include GitHub triage data")
  .action(async (opts: {
    path: string;
    json?: boolean;
    markdown?: boolean;
    output?: string;
    triage?: boolean;
  }) => {
    const root = resolve(opts.path);
    await generateAuditReport(root, {
      json: opts.json,
      markdown: opts.markdown,
      output: opts.output,
      includeTriage: opts.triage,
    });
  });

program
  .command("audit")
  .description("Run full maintainer audit (health + security)")
  .option("-p, --path <path>", "Repository path", ".")
  .option("--json", "Output as JSON")
  .action(async (opts: { path: string; json?: boolean }) => {
    const root = resolve(opts.path);
    const config = await loadConfig(root);
    const [health, security] = await Promise.all([
      runHealthAudit(root, opts.json, opts.json, config),
      runSecurityScan(root, { json: opts.json, silent: opts.json, config }),
    ]);

    if (opts.json) {
      console.log(JSON.stringify({ health, security }, null, 2));
      return;
    }

    const failed =
      health.score < config.minHealthScore ||
      security.summary.critical > 0 ||
      (config.failOnHighSeverity && security.summary.high > 0);
    if (failed) process.exit(1);
  });

program.parse();