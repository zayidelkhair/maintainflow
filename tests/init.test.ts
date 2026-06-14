import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { access } from "node:fs/promises";
import { describe, it, expect, beforeEach } from "vitest";
import { runInit } from "../src/commands/init.js";

describe("runInit", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "maintainflow-init-"));
  });

  it("creates essential maintainer files", async () => {
    const result = await runInit(tempDir);
    expect(result.created.length).toBeGreaterThan(3);
    await access(join(tempDir, "SECURITY.md"));
    await access(join(tempDir, ".maintainflow.json"));
    await access(join(tempDir, ".github", "workflows", "ci.yml"));
  });

  it("skips existing files without force", async () => {
    await runInit(tempDir);
    const second = await runInit(tempDir);
    expect(second.skipped.length).toBeGreaterThan(0);
    expect(second.created.length).toBe(0);
  });
});