# Contributing to maintainflow

Thank you for helping improve maintainer tooling for the open-source ecosystem.

## Getting started

```bash
git clone https://github.com/zayidelkhair/maintainflow.git
cd maintainflow
npm install
npm test
npm run build
```

## Development workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes with tests
4. Run `npm test && npm run lint`
5. Open a pull request with a clear description

## Code style

- TypeScript strict mode
- Match existing patterns in `src/`
- Add tests in `tests/` for new functionality
- Keep CLI output concise and actionable

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include your `maintainflow --version` and OS.

## Feature requests

Open an issue describing the maintainer pain point your idea solves. We prioritize features that reduce review load, improve security, or automate release workflows.