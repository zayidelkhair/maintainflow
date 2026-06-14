export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  file?: string;
  line?: number;
  recommendation?: string;
}

export interface HealthCheck {
  id: string;
  name: string;
  passed: boolean;
  weight: number;
  message: string;
}

export interface HealthReport {
  score: number;
  grade: string;
  checks: HealthCheck[];
  findings: Finding[];
}

export interface SecurityReport {
  scannedFiles: number;
  findings: Finding[];
  summary: Record<Severity, number>;
}

export interface TriageItem {
  type: "issue" | "pr";
  number: number;
  title: string;
  labels: string[];
  priority: "urgent" | "high" | "normal" | "low";
  reason: string;
}

export interface ReleaseChecklist {
  version: string;
  items: Array<{
    id: string;
    task: string;
    done: boolean;
    required: boolean;
  }>;
}

export interface MaintainflowConfig {
  minHealthScore?: number;
  failOnHighSeverity?: boolean;
  security?: {
    maxFiles?: number;
    exclude?: string[];
  };
  health?: {
    staleDays?: number;
  };
}

export interface ChangelogEntry {
  hash: string;
  date: string;
  author: string;
  subject: string;
  category: "features" | "fixes" | "breaking" | "other";
}

export interface ChangelogReport {
  version: string;
  since?: string;
  entries: ChangelogEntry[];
}

export interface AuditReport {
  generatedAt: string;
  health: HealthReport;
  security: SecurityReport;
  triage?: TriageItem[];
}