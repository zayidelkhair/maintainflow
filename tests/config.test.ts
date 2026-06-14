import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach } from "vitest";
import { loadConfig, getDefaultConfig } from "../src/lib/config.js";

describe("loadConfig", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "maintainflow-config-"));
  });

  it("returns defaults when no config file", async () => {
    const config = await loadConfig(tempDir);
    expect(config.minHealthScore).toBe(60);
    expect(config.security.maxFiles).toBe(500);
  });

  it("merges custom config values", async () => {
    await writeFile(
      join(tempDir, ".maintainflow.json"),
      JSON.stringify({ minHealthScore: 80, security: { maxFiles: 1000 } })
    );
    const config = await loadConfig(tempDir);
    expect(config.minHealthScore).toBe(80);
    expect(config.security.maxFiles).toBe(1000);
    expect(config.failOnHighSeverity).toBe(true);
  });
});

describe("getDefaultConfig", () => {
  it("returns a complete config object", () => {
    const config = getDefaultConfig();
    expect(config.health.staleDays).toBe(90);
  });
});