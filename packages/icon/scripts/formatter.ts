import fs from "fs";

/**
 * Converts a filename (kebab-case) to PascalCase.
 * e.g. "home-icon.svg" → "HomeIcon"
 */
export function toPascalCase(str: string) {
  return str.replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase()).replace(".svg", "");
}

/**
 * Converts a filename (kebab-case) to camelCase.
 * e.g. "home-icon.svg" → "homeIcon"
 */
export function toCamelCase(str: string) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
/**
 * @param dir directory path string (e.g. "./src/generated")
 * Ensures the directory exists (creates it if missing)
 */
export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
