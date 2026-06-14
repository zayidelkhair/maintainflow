import { describe, it, expect } from "vitest";
import { runReview } from "../src/commands/review.js";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

describe("runReview", () => {
  it("produces a codex prompt and target on a real git repo (this workspace)", async () => {
    // Use a controlled temp git repo (with 2 commits so HEAD~1 exists) instead of
    // the live workspace. This keeps the test hermetic, fast, and independent of
    // whether `gh` is present or what open PRs exist / shallow clone depth in CI.
    const dir = await mkdtemp(join(tmpdir(), "maintainflow-review-real-"));
    await exec("git", ["init", "-b", "main"], { cwd: dir });
    await exec("git", ["config", "user.email", "test@example.com"], { cwd: dir });
    await exec("git", ["config", "user.name", "Test"], { cwd: dir });
    await writeFile(join(dir, "README.md"), "# real-workspace-test\n\nInstall: npm i\nUsage: node index.js\n");
    await exec("git", ["add", "."], { cwd: dir });
    await exec("git", ["commit", "-m", "feat: first"], { cwd: dir });
    await mkdir(join(dir, "src"), { recursive: true });
    await writeFile(join(dir, "src", "dummy.ts"), "export const x = 1;\n");
    await exec("git", ["add", "."], { cwd: dir });
    await exec("git", ["commit", "-m", "feat: second"], { cwd: dir });

    const result = await runReview(dir, { path: dir });
    expect(result).toBeDefined();
    expect(result.target).toBeTruthy();
    expect(result.codexPrompt).toContain("You are Codex");
    expect(result.codexPrompt.length).toBeGreaterThan(100);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it("works in a fresh git repo with a commit", async () => {
    const dir = await mkdtemp(join(tmpdir(), "maintainflow-review-"));
    // init git and make a commit
    await exec("git", ["init", "-b", "main"], { cwd: dir });
    await exec("git", ["config", "user.email", "test@example.com"], { cwd: dir });
    await exec("git", ["config", "user.name", "Test"], { cwd: dir });
    await writeFile(join(dir, "README.md"), "# test\n\nInstall: npm i\nUsage: node .\n");
    await exec("git", ["add", "."], { cwd: dir });
    await exec("git", ["commit", "-m", "feat: init"], { cwd: dir });

    const result = await runReview(dir, { path: dir });
    expect(result.target.toLowerCase()).toContain("head");
    expect(result.codexPrompt).toContain("Project:");
  });
});
