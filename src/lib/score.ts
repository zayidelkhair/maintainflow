import type { HealthCheck } from "../types.js";

export function calculateHealthScore(checks: HealthCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  return Math.round((earned / totalWeight) * 100);
}