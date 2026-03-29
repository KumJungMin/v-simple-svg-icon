import fs from "fs";
import path from "path";
import { ensureDir } from "./formatter.ts";
import { generateIconFromSvg } from "./pipeline.ts";
import { loadExistingExports, generateIndexFile } from "./file-reader.ts";

const ICON_ASSET_PATH = path.resolve("src/assets/common");
const ICON_OUTPUT_DIR = path.resolve("src/generated/common");

main();

/**
 * Entry point for icon generation pipeline.
 *
 * 1. Ensure output directory exists
 * 2. Load existing index exports (for deduplication)
 * 3. Scan SVG files from source directory
 * 4. Process each SVG → generate meta + component
 * 5. Write aggregated index.ts
 */
function main() {
  ensureDir(ICON_OUTPUT_DIR);
  const indexPath = path.join(ICON_OUTPUT_DIR, "index.ts");
  const indexExports = loadExistingExports(indexPath);

  const svgFiles = fs.readdirSync(ICON_ASSET_PATH);

  for (const file of svgFiles) {
    if (!file.endsWith(".svg")) continue;

    generateIconFromSvg(file, indexExports, ICON_ASSET_PATH, ICON_OUTPUT_DIR);
  }

  generateIndexFile(indexPath, indexExports);

  console.log("✅ icons generated successfully");
}
