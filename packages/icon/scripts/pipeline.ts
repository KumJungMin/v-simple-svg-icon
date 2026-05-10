import fs from "fs";
import path from "path";
import { toPascalCase, toCamelCase } from "./formatter.ts";
import { extractSvgTree, flattenSvg } from "./ast-parser.ts";
import { generateMetaCode, generateIconCode } from "./codegen.ts";

/**
 * Processes a single SVG file and generates corresponding icon modules.
 *
 * Pipeline:
 * 1. Read SVG file
 * 2. Parse SVG → extract <svg> root
 * 3. Flatten SVG tree → nodes + color groups
 * 4. Generate meta file (icon structure)
 * 5. Generate icon component file
 * 6. Register exports for index.ts
 *
 * @param file SVG filename (e.g. "home-icon.svg")
 * @param indexExports export registry for index.ts aggregation
 * @param srcPath source directory containing SVG files
 * @param outPath output directory for generated files
 */
export function generateIconFromSvg(
  file: string,
  indexExports: Set<string>,
  srcPath: string,
  outPath: string
) {
  const filePath = path.join(srcPath, file);
  const raw = fs.readFileSync(filePath, "utf-8");

  const svg = extractSvgTree(raw);
  if (!svg) return;

  const { nodes, groups } = flattenSvg(svg, file);

  const baseName = file.replace(".svg", "");
  const pascalName = toPascalCase(baseName);
  const camelName = toCamelCase(baseName);

  const metaName = `${camelName}Meta`;
  const componentName = `${pascalName}Icon`;

  // meta
  const metaCode = generateMetaCode(metaName, pascalName, svg, nodes, groups);
  fs.writeFileSync(path.join(outPath, `${pascalName}.meta.ts`), metaCode);

  // icon
  const iconCode = generateIconCode(componentName, metaName, pascalName);
  fs.writeFileSync(path.join(outPath, `${pascalName}Icon.ts`), iconCode);

  // exports
  indexExports.add(`export { ${componentName} } from "./${pascalName}Icon";`);
  indexExports.add(`export { ${metaName} } from "./${pascalName}.meta";`);
  indexExports.add(`export type { ${pascalName}GroupName } from "./${pascalName}.meta";`);
}
