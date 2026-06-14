import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach } from "vitest";
import { generateAgentsMd } from "../src/commands/agents-md.js";

describe("generateAgentsMd", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "maintainflow-agents-"));
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        name: "my-oss-project",
        scripts: { test: "vitest run", build: "tsc" },
      })
    );
    await writeFile(join(tempDir, "README.md"), "# My OSS Project\n");
  });

  it("generates AGENTS.md with project name and commands", async () => {
    const content = await generateAgentsMd({ root: tempDir, dryRun: true });
    expect(content).toContain("my-oss-project");
    expect(content).toContain("npm test");
    expect(content).toContain("maintainflow security");
    expect(content).toContain("AGENTS.md");
  });
});