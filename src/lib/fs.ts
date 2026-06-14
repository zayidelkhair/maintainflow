import { readFile, access, readdir, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";

const SCANNABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".java", ".rb", ".php",
  ".cs", ".c", ".cpp", ".h", ".hpp", ".sh",
  ".yml", ".yaml", ".json", ".toml",
]);

const WALK_SKIP_DIRS = new Set([
  "node_modules", "dist", "build", ".git", "coverage", "vendor",
]);

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

function isScannableFile(name: string): boolean {
  if (name.startsWith(".env")) return true;
  const ext = extname(name).toLowerCase();
  return SCANNABLE_EXTENSIONS.has(ext);
}

export async function listSourceFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") && !entry.name.startsWith(".env")) continue;
      if (WALK_SKIP_DIRS.has(entry.name)) continue;

      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (isScannableFile(entry.name)) {
        files.push(full);
      }
    }
  }

  await walk(root);
  return files;
}

export async function getRepoName(root: string): Promise<string> {
  const pkg = await readTextFile(join(root, "package.json"));
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg) as { name?: string };
      if (parsed.name) return parsed.name;
    } catch {
      // fall through
    }
  }
  return relative(process.cwd(), root) || "repository";
}

export async function countFilesInDir(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        count += await countFilesInDir(full);
      } else {
        count += 1;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

export async function getFileSize(path: string): Promise<number> {
  try {
    const info = await stat(path);
    return info.size;
  } catch {
    return 0;
  }
}