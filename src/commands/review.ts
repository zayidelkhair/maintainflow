import { execFile } from "node:child_process";
import { promisify } from "node:util";
import chalk from "chalk";
import { getRepoName } from "../lib/fs.js";
import { getRemoteUrl, isGitRepo } from "../lib/git.js";
import type { TriageItem } from "../types.js";

const exec = promisify(execFile);

interface ReviewOptions {
  path: string;
  json?: boolean;
  pr?: string;
  commit?: string;
}

interface ReviewOutput {
  target: string;
  summary: string;
  codexPrompt: string;
  suggestions: string[];
  triageContext?: TriageItem[];
}

async function getDiff(root: string, target: string): Promise<string> {
  try {
    // Prefer short unified diff for prompt size
    const { stdout } = await exec("git", ["diff", "--unified=0", "--no-color", target], { cwd: root });
    return stdout.trim().slice(0, 8000); // cap size for prompt friendliness
  } catch {
    return "";
  }
}

async function getRecentCommitDiff(root: string): Promise<{ target: string; diff: string }> {
  try {
    const { stdout: rev } = await exec("git", ["rev-parse", "--short", "HEAD"], { cwd: root });
    const hash = rev.trim();
    const diff = await getDiff(root, "HEAD~1");
    return { target: `HEAD (${hash})`, diff };
  } catch {
    return { target: "HEAD", diff: "" };
  }
}

async function fetchPrForReview(root: string, prNumber?: string): Promise<{ title: string; body: string; diff: string } | null> {
  try {
    const args = prNumber
      ? ["pr", "view", prNumber, "--json", "title,body,number,headRefName"]
      : ["pr", "list", "--state", "open", "--limit", "1", "--json", "title,body,number,headRefName"];
    const { stdout } = await exec("gh", args, { cwd: root });
    const data = JSON.parse(stdout);
    const pr = Array.isArray(data) ? data[0] : data;
    if (!pr) return null;

    // Get the diff via git (more reliable than gh api for prompt)
    let diff = "";
    if (pr.headRefName) {
      diff = await getDiff(root, `origin/${pr.headRefName}...HEAD`);
    }
    if (!diff) diff = await getDiff(root, "HEAD~1");

    return {
      title: `#${pr.number || prNumber || "?"} ${pr.title || ""}`,
      body: pr.body || "",
      diff: diff || "(diff unavailable)",
    };
  } catch {
    return null;
  }
}

function buildCodexPrompt(project: string, target: string, context: string, diff: string): string {
  return `You are Codex, an expert open-source maintainer assistant.

Project: ${project}
Review target: ${target}

Task:
- Perform a thorough code review focused on security, correctness, maintainability, and OSS best practices.
- Flag any secrets, unsafe patterns, missing tests, or breaking changes.
- Suggest specific improvements with file/line references where possible.
- Propose a conventional commit message and a concise PR description.
- Output in this format:

## Security & Risk
## Maintainability & Style
## Testing & Docs Gaps
## Suggested Changes
## Commit Message

Additional context / triage notes:
${context}

Diff / Changes:
\`\`\`diff
${diff || "(no diff captured — paste the relevant diff here)"}
\`\`\`
`;
}

export async function runReview(root: string, options: ReviewOptions = { path: "." }): Promise<ReviewOutput> {
  const hasGit = await isGitRepo(root);
  const repoName = await getRepoName(root);
  const remote = hasGit ? await getRemoteUrl(root) : null;

  let target = "latest changes";
  let diff = "";
  let summary = "Local git changes review";
  let triageContext: TriageItem[] | undefined;

  // Priority: explicit PR > explicit commit-ish > gh latest open PR > recent local commit
  if (options.pr) {
    const prData = await fetchPrForReview(root, options.pr);
    if (prData) {
      target = prData.title;
      diff = prData.diff;
      summary = `Review of ${target}`;
    }
  } else if (options.commit) {
    diff = await getDiff(root, options.commit);
    target = options.commit;
    summary = `Review of commit/range ${target}`;
  } else {
    // Try gh first for a live PR only when we have a github remote.
    // This keeps tests (which use fresh local git with no remote) completely offline and fast.
    const isGithubRemote = !!remote && remote.includes('github.com');
    if (isGithubRemote) {
      const prData = await fetchPrForReview(root);
      if (prData) {
        target = prData.title;
        diff = prData.diff;
        summary = `Review of open PR: ${target}`;
      }
    }
    if (!target || target === "latest changes") {
      if (hasGit) {
        const recent = await getRecentCommitDiff(root);
        target = recent.target;
        diff = recent.diff;
        summary = `Review of recent commit: ${target}`;
      }
    }
  }

  // Also pull lightweight triage context only for github remotes (skips in hermetic tests)
  if (remote && remote.includes('github.com')) {
    try {
      // lightweight reuse of gh if possible (reuse same approach as triage but minimal)
      const { stdout } = await exec("gh", ["pr", "list", "--state", "open", "--limit", "3", "--json", "number,title,labels"], { cwd: root });
      const prs = JSON.parse(stdout) as Array<{ number: number; title: string; labels?: Array<{ name: string }> }>;
      if (prs && prs.length) {
        triageContext = prs.map((p) => ({
          type: "pr" as const,
          number: p.number,
          title: p.title,
          labels: (p.labels || []).map((l) => l.name),
          priority: "normal" as const,
          reason: "Open PR in queue",
        }));
      }
    } catch {
      // ignore, no gh
    }
  }

  const contextLines: string[] = [];
  if (remote) contextLines.push(`Repo: ${remote}`);
  if (triageContext && triageContext.length > 0) {
    contextLines.push("Recent open PRs: " + triageContext.map((t) => `#${t.number} ${t.title}`).join("; "));
  }

  const codexPrompt = buildCodexPrompt(repoName, target, contextLines.join("\n"), diff.slice(0, 6000));

  const suggestions: string[] = [
    "Run `maintainflow security` on the changed files",
    "Ensure new code has tests and updates AGENTS.md / docs if user-facing",
    "Check for high-entropy or new secret patterns introduced",
  ];

  const output: ReviewOutput = {
    target,
    summary,
    codexPrompt,
    suggestions,
    triageContext,
  };

  return output;
}

export async function printReview(root: string, options: ReviewOptions): Promise<void> {
  const out = await runReview(root, options);

  console.log();
  console.log(chalk.bold("Maintainer Review Assistant"));
  console.log(chalk.dim("─".repeat(40)));
  console.log(`${chalk.bold("Target:")} ${out.target}`);
  console.log(`${chalk.bold("Summary:")} ${out.summary}`);
  console.log();

  if (out.triageContext && out.triageContext.length) {
    console.log(chalk.bold("Open PR context:"));
    for (const item of out.triageContext) {
      console.log(`  #${item.number} ${item.title}`);
    }
    console.log();
  }

  console.log(chalk.bold("Codex Prompt (copy & paste into Codex / ChatGPT):"));
  console.log(chalk.dim("─".repeat(40)));
  console.log(out.codexPrompt);
  console.log(chalk.dim("─".repeat(40)));
  console.log();

  console.log(chalk.bold("Quick suggestions:"));
  for (const s of out.suggestions) {
    console.log(`  • ${s}`);
  }
  console.log();
}

export function formatReviewMarkdown(out: ReviewOutput): string {
  return `# Review — ${out.target}

${out.summary}

## Codex Prompt

\`\`\`text
${out.codexPrompt}
\`\`\`

## Suggestions
${out.suggestions.map((s) => `- ${s}`).join("\n")}
`;
}
