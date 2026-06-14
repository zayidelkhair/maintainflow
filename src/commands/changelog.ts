import chalk from "chalk";
import { getCommitsSince, getLatestTag } from "../lib/git.js";
import { readTextFile } from "../lib/fs.js";
import { join } from "node:path";
import type { ChangelogEntry, ChangelogReport } from "../types.js";

function categorize(subject: string): ChangelogEntry["category"] {
  const lower = subject.toLowerCase();
  if (lower.startsWith("feat") || lower.includes("add ") || lower.includes("new ")) return "features";
  if (lower.startsWith("fix") || lower.includes("bug")) return "fixes";
  if (lower.includes("breaking") || lower.startsWith("!")) return "breaking";
  return "other";
}

const CATEGORY_LABELS: Record<ChangelogEntry["category"], string> = {
  features: "Features",
  fixes: "Bug Fixes",
  breaking: "Breaking Changes",
  other: "Other",
};

export async function generateChangelog(
  root: string,
  options: { version?: string; since?: string; json?: boolean; silent?: boolean } = {}
): Promise<ChangelogReport> {
  const since = options.since ?? (await getLatestTag(root)) ?? undefined;
  const commits = await getCommitsSince(root, since);

  let version = options.version;
  if (!version) {
    const pkg = await readTextFile(join(root, "package.json"));
    if (pkg) {
      try {
        version = (JSON.parse(pkg) as { version?: string }).version;
      } catch {
        version = "Unreleased";
      }
    } else {
      version = "Unreleased";
    }
  }

  const entries: ChangelogEntry[] = commits.map((c) => ({
    ...c,
    category: categorize(c.subject),
  }));

  const report: ChangelogReport = { version: version ?? "Unreleased", since, entries };

  if (!options.silent) {
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printChangelog(report);
    }
  }

  return report;
}

function printChangelog(report: ChangelogReport): void {
  console.log();
  console.log(chalk.bold(`Changelog — v${report.version}`));
  if (report.since) console.log(chalk.dim(`Commits since ${report.since}`));
  console.log(chalk.dim("─".repeat(40)));

  if (report.entries.length === 0) {
    console.log(chalk.yellow("No commits found."));
    console.log();
    return;
  }

  const groups: ChangelogEntry["category"][] = ["breaking", "features", "fixes", "other"];
  for (const category of groups) {
    const group = report.entries.filter((e) => e.category === category);
    if (group.length === 0) continue;

    console.log();
    console.log(chalk.bold(CATEGORY_LABELS[category]));
    for (const entry of group) {
      console.log(`  - ${entry.subject} (${entry.hash}, ${entry.date})`);
    }
  }
  console.log();
}

export function formatChangelogMarkdown(report: ChangelogReport): string {
  const lines = [`## [${report.version}]`];
  if (report.since) lines.push(`_Changes since ${report.since}_`, "");

  const groups: ChangelogEntry["category"][] = ["breaking", "features", "fixes", "other"];
  for (const category of groups) {
    const group = report.entries.filter((e) => e.category === category);
    if (group.length === 0) continue;
    lines.push(`### ${CATEGORY_LABELS[category]}`, "");
    for (const entry of group) {
      lines.push(`- ${entry.subject} (${entry.hash})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}