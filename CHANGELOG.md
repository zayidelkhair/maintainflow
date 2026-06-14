# Changelog

All notable changes to maintainflow are documented here.

## [0.3.0] - 2026-06-14

### Added

- `maintainflow review` — Codex-ready review prompt generator + change analysis (ideal for feeding diffs + context directly to Codex / LLMs for high-quality PR and commit reviews)
- High-entropy secret detection (Shannon entropy on long credential-like values and base64-ish literals) — catches unknown/generic secrets the regexes miss
- New security patterns: Azure keys, Google API keys, Slack app tokens/signing secrets, GitLab PATs, extended PEM private key detection
- Expanded health audit: `.gitignore`, `FUNDING.yml` (or `.github/`), `CODEOWNERS`, package.json `bugs`/`homepage`, and README quality (install + usage sections)
- FUNDING.yml bootstrapped by `init`
- GitHub Action now supports `run-security`, `include-review` (Codex preview), and improved summaries
- Programmatic exports for `runReview`, `printReview`, `formatReviewMarkdown`
- New tests for entropy scanner and review command

### Changed

- Security scanner is significantly harder to evade for credential leaks
- Health scoring now rewards complete OSS governance and documentation hygiene (weights chosen to keep existing perfect scores achievable)
- `init`, agents-md generator, and docs reference the new review workflow

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