# Changelog

All notable changes to maintainflow are documented here.

## [0.2.0] - 2026-06-14

### Added

- `maintainflow init` — bootstrap SECURITY.md, CONTRIBUTING.md, CI, dependabot, and config
- `maintainflow changelog` — generate changelogs from git history (JSON or markdown)
- `maintainflow report` — full audit report with markdown/JSON export and README badge
- `.maintainflow.json` config — custom thresholds, scan exclusions, stale-day limits
- Security scan line numbers in findings
- New secret patterns: Stripe, Slack, npm, Discord, bearer tokens
- New vulnerability patterns: `document.write`, insecure `Math.random()`
- Health checks for AGENTS.md, Dependabot, and maintainflow config
- GitHub Action (`action.yml`) for one-line CI integration
- Programmatic exports for config, changelog, and report APIs

### Changed

- Security scanner uses line-by-line analysis for precise locations
- Audit command respects config thresholds (`minHealthScore`, `failOnHighSeverity`)

## [0.1.0] - 2026-06-14

### Added

- `maintainflow health` — repository health scoring and maintainer readiness audit
- `maintainflow security` — secret detection and vulnerability pattern scanning
- `maintainflow triage` — GitHub issue/PR priority ranking via `gh` CLI
- `maintainflow release` — release checklist with progress tracking
- `maintainflow agents-md` — AGENTS.md generator for AI coding agents
- `maintainflow audit` — combined health + security audit for CI
- Programmatic API exports for embedding in other tools
- GitHub Actions CI workflow
- Issue templates for bugs and feature requests