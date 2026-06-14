import { join } from "node:path";
import { readTextFile } from "./fs.js";
import type { MaintainflowConfig } from "../types.js";

const DEFAULT_CONFIG: Required<MaintainflowConfig> = {
  minHealthScore: 60,
  failOnHighSeverity: true,
  security: {
    maxFiles: 500,
    exclude: [],
  },
  health: {
    staleDays: 90,
  },
};

export async function loadConfig(root: string): Promise<Required<MaintainflowConfig>> {
  const content = await readTextFile(join(root, ".maintainflow.json"));
  if (!content) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(content) as MaintainflowConfig;
    return {
      minHealthScore: parsed.minHealthScore ?? DEFAULT_CONFIG.minHealthScore,
      failOnHighSeverity: parsed.failOnHighSeverity ?? DEFAULT_CONFIG.failOnHighSeverity,
      security: {
        maxFiles: parsed.security?.maxFiles ?? DEFAULT_CONFIG.security.maxFiles,
        exclude: parsed.security?.exclude ?? DEFAULT_CONFIG.security.exclude,
      },
      health: {
        staleDays: parsed.health?.staleDays ?? DEFAULT_CONFIG.health.staleDays,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function getDefaultConfig(): Required<MaintainflowConfig> {
  return { ...DEFAULT_CONFIG };
}