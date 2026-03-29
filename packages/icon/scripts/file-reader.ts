import fs from "fs";

/** Loads existing export statements from index.ts */
export function loadExistingExports(indexPath: string): Set<string> {
  const exportsSet = new Set<string>();

  if (!fs.existsSync(indexPath)) return exportsSet;

  const content = fs.readFileSync(indexPath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("export")) {
      exportsSet.add(trimmed);
    }
  }
  return exportsSet;
}

export function generateIndexFile(indexPath: string, exportsSet: Set<string>): void {
  const sortedExports = Array.from(exportsSet).sort();
  fs.writeFileSync(indexPath, sortedExports.join("\n"));
}
