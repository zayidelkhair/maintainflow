import { describe, it, expect } from "vitest";
import { runReview } from "../src/commands/review.js";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

describe("runReview", () => {
  it("produces a codex prompt and target on a real git repo (this workspace)", async () => {
    // Run against the project root which is a git checkout
    const root = process.cwd();
    const result = await runReview(root, { path: root });
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
