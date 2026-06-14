# maintainflow

**Open-source maintainer toolkit** — repo health audits, security scanning, issue/PR triage, release checklists, and AGENTS.md generation for OSS projects.

Built for maintainers who review pull requests, triage issues, cut releases, and keep repositories secure — the exact workflows the [Codex for Open Source](https://openai.com/form/codex-for-oss/) program supports.

[![CI](https://github.com/zayidelkhair/maintainflow/actions/workflows/ci.yml/badge.svg)](https://github.com/zayidelkhair/maintainflow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/maintainflow.svg)](https://www.npmjs.com/package/maintainflow)

## Why maintainflow?

Open-source maintainers carry disproportionate load: security reviews, release coordination, contributor triage, and keeping CI green — often unpaid and understaffed. **maintainflow** automates the repetitive parts so you can focus on code review and community.

| Command | What it does |
|---------|-------------|
| `health` | Score your repo's maintainer readiness (README, LICENSE, CI, SECURITY.md, activity) |
| `security` | Scan for leaked secrets, hardcoded credentials, and common vulnerability patterns |
| `triage` | Prioritize open GitHub issues and PRs by urgency (requires [GitHub CLI](https://cli.github.com/)) |
| `release` | Interactive release checklist — changelog, version bump, publish, announce |
| `agents-md` | Generate `AGENTS.md` for Codex, Copilot, and other AI coding agents |
| `audit` | Run health + security in one pass (great for CI) |

## Quick start

```bash
# Run without installing
npx maintainflow health

# Or install globally
npm install -g maintainflow
maintainflow audit
```

## Usage

### Repository health audit

```bash
maintainflow health
maintainflow health --path /path/to/repo --json
```

Checks for README, LICENSE, CONTRIBUTING.md, SECURITY.md, CI workflows, test scripts, recent activity, and more. Returns a score out of 100 with actionable recommendations.

### Security scan

```bash
maintainflow security
maintainflow security --max-files 1000
```

Scans source files for:

- AWS keys, GitHub tokens, OpenAI API keys, private keys
- Hardcoded passwords and secrets
- `eval()`, SQL injection patterns, XSS risks
- Committed `.env` files and missing lockfiles

### Issue & PR triage

```bash
maintainflow triage
```

Requires `gh` CLI authenticated (`gh auth login`). Prioritizes items tagged `bug`, `security`, `critical`, and flags stale PRs.

### Release checklist

```bash
maintainflow release --save
maintainflow release-done changelog
```

Tracks release tasks in `.maintainflow-release.json`.

### Generate AGENTS.md

```bash
maintainflow agents-md
maintainflow agents-md --dry-run
```

Creates a maintainer-focused `AGENTS.md` tailored to your project's stack — compatible with [Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md) workflows.

### Full audit (CI-friendly)

```bash
maintainflow audit
```

Exits with code 1 if health score < 60 or critical/high security findings exist.

## CI integration

Add to your GitHub Actions workflow:

```yaml
- run: npx maintainflow@latest audit
```

Or use the built-in workflow in this repo as a template.

## Programmatic API

```typescript
import { runHealthAudit, runSecurityScan } from "maintainflow";

const health = await runHealthAudit("./my-repo", true);
const security = await runSecurityScan("./my-repo", { json: true });
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). We welcome issues and PRs from maintainers building better OSS tooling.

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

MIT © [Zayid Elkahir](https://github.com/zayidelkhair)