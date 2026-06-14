import { readFile, access, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { glob } from "glob";

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

export async function listSourceFiles(
  root: string,
  patterns: string[] = ["**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,java,rb,php,cs,c,cpp,h,hpp,sh,yml,yaml,json,toml,env*}"]
): Promise<string[]> {
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: root,
      absolute: true,
      nodir: true,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.git/**",
        "**/coverage/**",
        "**/vendor/**",
      ],
    });
    files.push(...matches);
  }
  return [...new Set(files)];
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