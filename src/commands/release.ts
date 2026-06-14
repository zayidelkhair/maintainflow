import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { pathExists, readTextFile } from "../lib/fs.js";
import type { ReleaseChecklist } from "../types.js";

const DEFAULT_CHECKLIST: Array<{ id: string; task: string; required: boolean }> = [
  { id: "changelog", task: "Update CHANGELOG.md with release notes", required: true },
  { id: "version-bump", task: "Bump version in package.json / pyproject.toml", required: true },
  { id: "tests-pass", task: "All CI tests pass on release branch", required: true },
  { id: "security-scan", task: "Run maintainflow security scan with zero critical findings", required: true },
  { id: "docs", task: "Update documentation for new features or breaking changes", required: true },
  { id: "breaking-changes", task: "Document breaking changes in README and CHANGELOG", required: false },
  { id: "deprecations", task: "Add deprecation notices for removed APIs", required: false },
  { id: "npm-publish", task: "Publish to npm registry (npm publish --access public)", required: false },
  { id: "github-release", task: "Create GitHub release with tag and release notes", required: true },
  { id: "announce", task: "Announce release in discussions or community channels", required: false },
];

async function detectVersion(root: string): Promise<string> {
  const pkgPath = join(root, "package.json");
  const content = await readTextFile(pkgPath);
  if (content) {
    try {
      const pkg = JSON.parse(content) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // fall through
    }
  }
  return "0.0.0";
}

export async function runReleaseChecklist(
  root: string,
  options: { version?: string; json?: boolean; save?: boolean } = {}
): Promise<ReleaseChecklist> {
  const version = options.version ?? (await detectVersion(root));
  const checklistPath = join(root, ".maintainflow-release.json");

  let items = DEFAULT_CHECKLIST.map((item) => ({
    ...item,
    done: false,
  }));

  if (await pathExists(checklistPath)) {
    try {
      const saved = JSON.parse(await readFile(checklistPath, "utf-8")) as ReleaseChecklist;
      if (saved.version === version) {
        items = saved.items;
      }
    } catch {
      // use defaults
    }
  }

  const changelogExists = await pathExists(join(root, "CHANGELOG.md"));
  const changelogItem = items.find((i) => i.id === "changelog");
  if (changelogItem && changelogExists) {
    const content = await readTextFile(join(root, "CHANGELOG.md"));
    if (content?.includes(version)) {
      changelogItem.done = true;
    }
  }

  const checklist: ReleaseChecklist = { version, items };

  if (options.save) {
    await writeFile(checklistPath, JSON.stringify(checklist, null, 2));
    console.log(chalk.green(`Saved checklist to .maintainflow-release.json`));
  }

  if (options.json) {
    console.log(JSON.stringify(checklist, null, 2));
  } else {
    printReleaseChecklist(checklist);
  }

  return checklist;
}

function printReleaseChecklist(checklist: ReleaseChecklist): void {
  console.log();
  console.log(chalk.bold(`Release Checklist — v${checklist.version}`));
  console.log(chalk.dim("─".repeat(40)));

  const required = checklist.items.filter((i) => i.required);
  const optional = checklist.items.filter((i) => !i.required);
  const doneRequired = required.filter((i) => i.done).length;

  console.log(
    `Progress: ${doneRequired}/${required.length} required tasks complete`
  );
  console.log();

  console.log(chalk.bold("Required"));
  for (const item of required) {
    const icon = item.done ? chalk.green("[x]") : chalk.red("[ ]");
    console.log(`  ${icon} ${item.task}`);
  }

  if (optional.length > 0) {
    console.log();
    console.log(chalk.bold("Optional"));
    for (const item of optional) {
      const icon = item.done ? chalk.green("[x]") : chalk.gray("[ ]");
      console.log(`  ${icon} ${item.task}`);
    }
  }

  console.log();
  console.log(chalk.dim("Mark items done by editing .maintainflow-release.json or re-running after completing tasks."));
  console.log();
}

async function loadChecklist(root: string): Promise<ReleaseChecklist> {
  const version = await detectVersion(root);
  const checklistPath = join(root, ".maintainflow-release.json");
  let items = DEFAULT_CHECKLIST.map((item) => ({ ...item, done: false }));

  if (await pathExists(checklistPath)) {
    try {
      const saved = JSON.parse(await readFile(checklistPath, "utf-8")) as ReleaseChecklist;
      if (saved.version === version) items = saved.items;
    } catch {
      // use defaults
    }
  }

  return { version, items };
}

export async function markReleaseItem(
  root: string,
  itemId: string,
  done = true
): Promise<void> {
  const checklistPath = join(root, ".maintainflow-release.json");
  const checklist = await loadChecklist(root);
  const item = checklist.items.find((i) => i.id === itemId);

  if (!item) {
    console.error(chalk.red(`Unknown checklist item: ${itemId}`));
    process.exit(1);
  }

  item.done = done;
  await writeFile(checklistPath, JSON.stringify(checklist, null, 2));
  console.log(chalk.green(`Marked "${item.task}" as ${done ? "done" : "pending"}.`));
}