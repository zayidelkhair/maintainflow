import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { pathExists } from "../lib/fs.js";
import { getDefaultConfig } from "../lib/config.js";

interface InitTemplate {
  path: string;
  content: string | (() => string);
  isDir?: boolean;
}

function defaultConfigJson(): string {
  return JSON.stringify(getDefaultConfig(), null, 2) + "\n";
}

const TEMPLATES: InitTemplate[] = [
  {
    path: ".maintainflow.json",
    content: defaultConfigJson,
  },
  {
    path: "FUNDING.yml",
    content: `# GitHub Sponsors (recommended)
github: [your-github-username]

# Other platforms (uncomment as needed)
# patreon: your-patreon
# ko_fi: your-kofi
# custom: ['https://example.com/sponsor']
`,
  },
  {
    path: "SECURITY.md",
    content: `# Security Policy

## Reporting a Vulnerability

Do not open public issues for security vulnerabilities.

Email the maintainer with a description, reproduction steps, and impact assessment.
We aim to respond within 72 hours.

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | Yes       |
`,
  },
  {
    path: "CONTRIBUTING.md",
    content: `# Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Run \`npx maintainflow audit\` before opening a PR
5. Open a pull request with a clear description
`,
  },
  {
    path: "CODE_OF_CONDUCT.md",
    content: `# Code of Conduct

We pledge to foster an open and welcoming environment.
Unacceptable behavior includes harassment, trolling, and personal attacks.
Report issues to the project maintainer.
`,
  },
  {
    path: ".github/workflows/ci.yml",
    content: `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test

  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx maintainflow@latest audit
`,
  },
  {
    path: ".github/dependabot.yml",
    content: `version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
`,
  },
];

export async function runInit(
  root: string,
  options: { force?: boolean; dryRun?: boolean } = {}
): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const template of TEMPLATES) {
    const fullPath = join(root, template.path);
    const exists = await pathExists(fullPath);

    if (exists && !options.force) {
      skipped.push(template.path);
      continue;
    }

    const content = typeof template.content === "function" ? template.content() : template.content;

    if (options.dryRun) {
      console.log(chalk.dim(`Would create: ${template.path}`));
      created.push(template.path);
      continue;
    }

    await mkdir(join(fullPath, ".."), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
    created.push(template.path);
    console.log(chalk.green(`Created ${template.path}`));
  }

  if (!options.dryRun) {
    console.log();
    console.log(chalk.bold(`Done — ${created.length} file(s) created, ${skipped.length} skipped.`));
    if (skipped.length > 0) {
      console.log(chalk.dim(`Skipped (already exist): ${skipped.join(", ")}`));
      console.log(chalk.dim("Use --force to overwrite."));
    }
    console.log(chalk.dim("Next: run `maintainflow agents-md` and `maintainflow audit`"));
    console.log();
  }

  return { created, skipped };
}