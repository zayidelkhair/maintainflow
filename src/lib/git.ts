import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function isGitRepo(root: string): Promise<boolean> {
  try {
    await exec("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root });
    return true;
  } catch {
    return false;
  }
}

export async function getRemoteUrl(root: string): Promise<string | null> {
  try {
    const { stdout } = await exec("git", ["remote", "get-url", "origin"], { cwd: root });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function getDefaultBranch(root: string): Promise<string> {
  try {
    const { stdout } = await exec("git", ["symbolic-ref", "refs/remotes/origin/HEAD"], {
      cwd: root,
    });
    const match = stdout.trim().match(/refs\/remotes\/origin\/(.+)/);
    return match?.[1] ?? "main";
  } catch {
    return "main";
  }
}

export async function getLastCommitDate(root: string): Promise<Date | null> {
  try {
    const { stdout } = await exec("git", ["log", "-1", "--format=%cI"], { cwd: root });
    const date = new Date(stdout.trim());
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export async function getContributorCount(root: string): Promise<number> {
  try {
    const { stdout } = await exec("git", ["shortlog", "-sn", "--all", "--no-merges"], {
      cwd: root,
    });
    return stdout.trim() ? stdout.trim().split("\n").length : 0;
  } catch {
    return 0;
  }
}

export async function getOpenIssuesAndPRs(
  root: string
): Promise<{ issues: number; prs: number } | null> {
  try {
    const { stdout: issueOut } = await exec(
      "gh",
      ["issue", "list", "--state", "open", "--limit", "1000", "--json", "number"],
      { cwd: root }
    );
    const { stdout: prOut } = await exec(
      "gh",
      ["pr", "list", "--state", "open", "--limit", "1000", "--json", "number"],
      { cwd: root }
    );
    const issues = JSON.parse(issueOut) as unknown[];
    const prs = JSON.parse(prOut) as unknown[];
    return { issues: issues.length, prs: prs.length };
  } catch {
    return null;
  }
}