import { execFile } from "node:child_process";
import { promisify } from "node:util";
import chalk from "chalk";
import type { TriageItem } from "../types.js";

const exec = promisify(execFile);

interface GhIssue {
  number: number;
  title: string;
  labels: Array<{ name: string }>;
  createdAt: string;
  updatedAt: string;
  comments: Array<{ author: { login: string } }>;
}

const URGENT_LABELS = new Set([
  "bug",
  "security",
  "critical",
  "urgent",
  "blocker",
  "p0",
  "regression",
]);

const HIGH_LABELS = new Set(["enhancement", "feature", "help wanted", "good first issue"]);

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function classifyPriority(
  labels: string[],
  createdAt: string,
  type: "issue" | "pr"
): { priority: TriageItem["priority"]; reason: string } {
  const lower = labels.map((l) => l.toLowerCase());
  const age = daysSince(createdAt);

  if (lower.some((l) => URGENT_LABELS.has(l))) {
    return { priority: "urgent", reason: "Tagged as security/critical/bug" };
  }

  if (type === "pr" && age > 14) {
    return { priority: "high", reason: `PR open for ${age} days — review backlog risk` };
  }

  if (age > 30) {
    return { priority: "high", reason: `Open for ${age} days without resolution` };
  }

  if (lower.some((l) => HIGH_LABELS.has(l))) {
    return { priority: "normal", reason: "Community contribution or feature request" };
  }

  if (age > 7) {
    return { priority: "normal", reason: `Open for ${age} days` };
  }

  return { priority: "low", reason: "Recently opened" };
}

async function fetchGhItems(
  root: string,
  type: "issue" | "pr"
): Promise<GhIssue[]> {
  const subcommand = type === "pr" ? "pr" : "issue";
  try {
    const { stdout } = await exec(
      "gh",
      [
        subcommand,
        "list",
        "--state",
        "open",
        "--limit",
        "50",
        "--json",
        "number,title,labels,createdAt,updatedAt,comments",
      ],
      { cwd: root }
    );
    return JSON.parse(stdout) as GhIssue[];
  } catch {
    return [];
  }
}

function printTriageReport(items: TriageItem[], usedGh: boolean): void {
  console.log();
  console.log(chalk.bold("Triage Report"));
  console.log(chalk.dim("─".repeat(40)));

  if (!usedGh) {
    console.log(chalk.yellow("GitHub CLI (gh) not available or not authenticated."));
    console.log(chalk.dim("Install gh and run: gh auth login"));
    console.log();
    console.log(chalk.bold("Manual triage checklist:"));
    console.log("  1. Review open issues tagged bug/security first");
    console.log("  2. Triage PRs older than 7 days");
    console.log("  3. Close stale issues with no activity in 60+ days");
    console.log("  4. Label unlabeled issues for contributor routing");
    console.log();
    return;
  }

  if (items.length === 0) {
    console.log(chalk.green("No open issues or PRs — inbox zero!"));
    console.log();
    return;
  }

  const order: TriageItem["priority"][] = ["urgent", "high", "normal", "low"];
  const priorityColors: Record<TriageItem["priority"], (t: string) => string> = {
    urgent: chalk.red.bold,
    high: chalk.yellow,
    normal: chalk.blue,
    low: chalk.gray,
  };

  for (const priority of order) {
    const group = items.filter((i) => i.priority === priority);
    if (group.length === 0) continue;

    console.log();
    console.log(priorityColors[priority](`${priority.toUpperCase()} (${group.length})`));
    for (const item of group) {
      const prefix = item.type === "pr" ? "PR" : "Issue";
      const labels = item.labels.length ? chalk.dim(` [${item.labels.join(", ")}]`) : "";
      console.log(`  #${item.number} ${prefix}: ${item.title}${labels}`);
      console.log(chalk.dim(`    → ${item.reason}`));
    }
  }
  console.log();
}

export async function runTriage(
  root: string,
  json = false,
  silent = false
): Promise<TriageItem[]> {
  const [issues, prs] = await Promise.all([
    fetchGhItems(root, "issue"),
    fetchGhItems(root, "pr"),
  ]);

  const usedGh = issues.length > 0 || prs.length > 0;

  const items: TriageItem[] = [
    ...issues.map((issue) => {
      const labels = issue.labels.map((l) => l.name);
      const { priority, reason } = classifyPriority(labels, issue.createdAt, "issue");
      return {
        type: "issue" as const,
        number: issue.number,
        title: issue.title,
        labels,
        priority,
        reason,
      };
    }),
    ...prs.map((pr) => {
      const labels = pr.labels.map((l) => l.name);
      const { priority, reason } = classifyPriority(labels, pr.createdAt, "pr");
      return {
        type: "pr" as const,
        number: pr.number,
        title: pr.title,
        labels,
        priority,
        reason,
      };
    }),
  ];

  items.sort((a, b) => {
    const order = { urgent: 0, high: 1, normal: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  if (!silent) {
    if (json) {
      console.log(JSON.stringify(items, null, 2));
    } else {
      printTriageReport(items, usedGh);
    }
  }

  return items;
}