# maintainflow

**Open-source maintainer toolkit** — repo health audits, security scanning, issue/PR triage, release checklists, and AGENTS.md generation for OSS projects.

Built for maintainers who review pull requests, triage issues, cut releases, and keep repositories secure — the exact workflows the [Codex for Open Source](https://openai.com/form/codex-for-oss/) program supports.

[![CI](https://github.com/zayidelkhair/maintainflow/actions/workflows/ci.yml/badge.svg)](https://github.com/zayidelkhair/maintainflow/actions/workflows/ci.yml)
[![maintainflow health](https://img.shields.io/badge/maintainflow_health-100%2F100-brightgreen)](https://github.com/zayidelkhair/maintainflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/maintainflow.svg)](https://www.npmjs.com/package/maintainflow)

## Why maintainflow?

Open-source maintainers carry disproportionate load: security reviews, release coordination, contributor triage, and keeping CI green — often unpaid and understaffed. **maintainflow** automates the repetitive parts so you can focus on code review and community.

| Command | What it does |
|---------|-------------|
| `init` | Bootstrap SECURITY.md, CONTRIBUTING.md, CI, dependabot, and config |
| `health` | Score your repo's maintainer readiness (README, LICENSE, CI, SECURITY.md, AGENTS.md) |
| `security` | Scan for leaked secrets with **line numbers** and vulnerability patterns |
| `triage` | Prioritize open GitHub issues and PRs by urgency (requires [GitHub CLI](https://cli.github.com/)) |
| `changelog` | Generate release notes from git commits |
| `release` | Interactive release checklist — changelog, version bump, publish, announce |
| `agents-md` | Generate `AGENTS.md` for Codex, Copilot, and other AI coding agents |
| `report` | Full markdown/JSON audit report with README badge |
| `audit` | Run health + security in one pass (great for CI) |
| `review` | AI-optimized (Codex-ready) change review prompt generator for fast, high-signal reviews |
| `review` | Generate ready-to-paste **Codex / LLM** review prompts + analysis for PRs, commits or HEAD changes |

## Quick start

```bash
# Bootstrap a new OSS repo
npx maintainflow init

# Run a full audit
npx maintainflow audit

# Generate a markdown report
npx maintainflow report --markdown --output AUDIT.md
```

## Configuration

Create `.maintainflow.json` in your repo root (or run `maintainflow init`):

```json
{
  "minHealthScore": 60,
  "failOnHighSeverity": true,
  "security": {
    "maxFiles": 500,
    "exclude": ["fixtures/", "testdata/"]
  },
  "health": {
    "staleDays": 90
  }
}
```

## Usage

### Bootstrap a new project

```bash
maintainflow init
maintainflow agents-md
maintainflow audit
```

Creates SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, CI workflow, dependabot config, and `.maintainflow.json`.

### Repository health audit

```bash
maintainflow health
maintainflow health --json
```

Checks README, LICENSE, CONTRIBUTING.md, SECURITY.md, AGENTS.md, Dependabot, CI, issue templates, test scripts, and recent git activity. Returns a score out of 100.

### Security scan

```bash
maintainflow security
```

Detects AWS keys, GitHub tokens, OpenAI/Stripe/Slack/npm/Discord secrets, private keys, JWTs, `eval()`, XSS patterns, SQL injection, and more — with **file and line numbers**.

### Generate changelog

```bash
maintainflow changelog --since v0.1.0
maintainflow changelog --markdown -o CHANGELOG_ENTRY.md
```

Groups commits into Features, Bug Fixes, Breaking Changes, and Other.

### Full audit report

```bash
maintainflow report --markdown --output AUDIT.md --triage
```

Produces a shareable markdown report with health table, security findings, and optional triage summary.

### AI-powered reviews (Codex / LLM ready)

```bash
# Analyze latest commit / HEAD and get a full structured prompt
maintainflow review

# Target a specific PR (uses gh)
maintainflow review --pr 42
```

The output includes a **"Codex Prompt"** block you can paste verbatim into Codex, ChatGPT, Claude etc. It bundles diff + project context + triage hints + explicit review instructions for security, maintainability and OSS hygiene. Perfect pairing with Codex for OSS access.

Security scanning also now includes **high-entropy detection** (catches unknown tokens and keys that regexes miss) plus expanded coverage for Azure, Google, GitLab, Slack app secrets, and PEM blocks.

### CI integration

**Option 1 — one-liner:**

```yaml
- run: npx maintainflow@latest audit
```

**Option 2 — GitHub Action:**

```yaml
- uses: zayidelkhair/maintainflow@v0.3.0
  with:
    path: .
```

## Programmatic API

```typescript
import {
  runHealthAudit,
  runSecurityScan,
  generateChangelog,
  generateAuditReport,
  loadConfig,
} from "maintainflow";

const config = await loadConfig("./my-repo");
const health = await runHealthAudit("./my-repo", true, true, config);
const security = await runSecurityScan("./my-repo", { silent: true, config });
const changelog = await generateChangelog("./my-repo", { silent: true });
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). We welcome issues and PRs from maintainers building better OSS tooling.

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

MIT © [Zayid Elkahir](https://github.com/zayidelkhair)