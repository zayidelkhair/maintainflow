# AGENTS.md

> Maintainer instructions for AI coding agents (Codex, Copilot, Claude, etc.)

## Project Overview

**maintainflow** is an open-source CLI toolkit for repository maintainers.
Repository: https://github.com/zayidelkhair/maintainflow.git

## Repository Structure

- `src/commands/` — CLI command implementations
- `src/lib/` — shared utilities (fs, git, reporting)
- `tests/` — vitest test suite
- `.github/workflows/` — CI configuration

## Development Setup

```bash
git clone https://github.com/zayidelkhair/maintainflow.git
cd maintainflow
npm install
```

## Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Build | `npm run build` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Health audit | `npx maintainflow health` |
| Security scan | `npx maintainflow security` |

## Coding Guidelines

- TypeScript strict mode; no `any` without justification
- Match existing code style in `src/`
- Write tests for new commands and lib functions
- Keep changes focused — no unrelated refactors
- CLI output should use chalk for severity coloring

## Pull Request Checklist

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No secrets in code (`maintainflow security`)
- [ ] CHANGELOG updated for user-facing changes

## Security

- Never commit API keys or tokens
- Run `maintainflow security` before releases
- Report vulnerabilities via SECURITY.md

## What NOT to Do

- Do not weaken existing security scan patterns without discussion
- Do not remove tests
- Do not change CI without maintainer approval