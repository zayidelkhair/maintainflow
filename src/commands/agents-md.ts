import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { getRepoName, pathExists, readTextFile } from "../lib/fs.js";
import { getDefaultBranch, getRemoteUrl, isGitRepo } from "../lib/git.js";

interface AgentsMdOptions {
  root: string;
  output?: string;
  dryRun?: boolean;
  language?: string;
}

async function detectLanguage(root: string): Promise<string> {
  const pkg = await pathExists(join(root, "package.json"));
  if (pkg) return "TypeScript/JavaScript (Node.js)";
  if (await pathExists(join(root, "pyproject.toml"))) return "Python";
  if (await pathExists(join(root, "go.mod"))) return "Go";
  if (await pathExists(join(root, "Cargo.toml"))) return "Rust";
  return "Multi-language";
}

async function detectTestCommand(root: string): Promise<string> {
  const content = await readTextFile(join(root, "package.json"));
  if (content) {
    try {
      const pkg = JSON.parse(content) as { scripts?: Record<string, string> };
      if (pkg.scripts?.test) return `npm test`;
      if (pkg.scripts?.["test:unit"]) return `npm run test:unit`;
    } catch {
      // fall through
    }
  }
  if (await pathExists(join(root, "pytest.ini"))) return "pytest";
  if (await pathExists(join(root, "go.mod"))) return "go test ./...";
  return "# add your test command here";
}

async function detectBuildCommand(root: string): Promise<string> {
  const content = await readTextFile(join(root, "package.json"));
  if (content) {
    try {
      const pkg = JSON.parse(content) as { scripts?: Record<string, string> };
      if (pkg.scripts?.build) return "npm run build";
    } catch {
      // fall through
    }
  }
  return "# add your build command here";
}

export async function generateAgentsMd(options: AgentsMdOptions): Promise<string> {
  const { root, dryRun = false } = options;
  const repoName = await getRepoName(root);
  const language = options.language ?? (await detectLanguage(root));
  const testCmd = await detectTestCommand(root);
  const buildCmd = await detectBuildCommand(root);
  const hasGit = await isGitRepo(root);
  const remote = hasGit ? await getRemoteUrl(root) : null;
  const branch = hasGit ? await getDefaultBranch(root) : "main";

  const content = `# AGENTS.md

> Maintainer instructions for AI coding agents (Codex, Copilot, Claude, etc.)

## Project Overview

**${repoName}** is an open-source project written in ${language}.
${remote ? `Repository: ${remote}` : ""}

## Repository Structure

- Read \`README.md\` for project purpose and quickstart
- Source code lives in \`src/\`
- Tests live in \`tests/\`
- CI configuration is in \`.github/workflows/\`

## Development Setup

\`\`\`bash
git clone ${remote ?? "<repo-url>"}
cd ${repoName}
npm install   # or equivalent for your stack
\`\`\`

## Commands

| Task | Command |
|------|---------|
| Install | \`npm install\` |
| Build | \`${buildCmd}\` |
| Test | \`${testCmd}\` |
| Lint | \`npm run lint\` |
| Health audit | \`npx maintainflow health\` |
| Security scan | \`npx maintainflow security\` |
| Codex review prompt | \`npx maintainflow review\` |

## Coding Guidelines

- Match existing code style, naming conventions, and file organization
- Write tests for new functionality; do not reduce test coverage
- Keep changes focused — avoid unrelated refactors in the same PR
- Use TypeScript strict mode; no \`any\` without justification
- Prefer small, reviewable commits with clear messages

## Pull Request Checklist

Before opening a PR, ensure:

- [ ] Tests pass locally (\`${testCmd}\`)
- [ ] No secrets or credentials in code (\`maintainflow security\`)
- [ ] README updated if behavior changes
- [ ] CHANGELOG entry added for user-facing changes

## Security

- Never commit API keys, tokens, or private keys
- Run \`maintainflow security\` before every release
- Report vulnerabilities via SECURITY.md (do not open public issues)

## Maintainer Workflows

- Use \`maintainflow triage\` to prioritize open issues and PRs
- Use \`maintainflow release\` before cutting a new version
- Default branch: \`${branch}\`

## What NOT to Do

- Do not delete or weaken existing tests without maintainer approval
- Do not change CI configuration without discussion
- Do not add large dependencies without justification
- Do not modify LICENSE or legal files
`;

  const outputPath = options.output ?? join(root, "AGENTS.md");

  if (dryRun) {
    if (process.env.NODE_ENV !== "test") {
      console.log(content);
    }
  } else {
    await writeFile(outputPath, content, "utf-8");
    if (process.env.NODE_ENV !== "test") {
      console.log(chalk.green(`Generated ${outputPath}`));
    }
  }

  return content;
}