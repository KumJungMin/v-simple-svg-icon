import fs from "fs";
import path from "path";
import { parse } from "svg-parser";

/**
 * 설정
 */
const SRC = path.resolve("src/assets/common");
const OUT = path.resolve("src/generated/common");

/**
 * kebab → PascalCase
 */
function toPascalCase(str: string) {
  return str.replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase()).replace(".svg", "");
}

/**
 * camelCase
 */
function toCamelCase(str: string) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * 디렉토리 보장
 */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(OUT);

const indexExports: string[] = [];

/**
 * SVG 처리
 */
fs.readdirSync(SRC).forEach((file) => {
  if (!file.endsWith(".svg")) return;

  const raw = fs.readFileSync(path.join(SRC, file), "utf-8");
  const parsed = parse(raw);

  const svg = parsed.children.find((n: any) => n.tagName === "svg");
  if (!svg) return;

  const nodes: any[] = [];
  const groups = new Set<string>();

  /**
   * flatten + group 추출
   */
  function walk(children: any[]) {
    children.forEach((n) => {
      if (!n.tagName) return;

      const attrs = n.properties || {};

      if (attrs["data-color-group"]) {
        groups.add(attrs["data-color-group"]);
      }

      nodes.push({
        tag: n.tagName,
        attrs,
      });

      if (n.children?.length) {
        walk(n.children);
      }
    });
  }

  walk(svg.children);

  const baseName = file.replace(".svg", "");
  const pascalName = toPascalCase(baseName);
  const camelName = toCamelCase(baseName);

  const metaName = `${camelName}Meta`;
  const componentName = `${pascalName}Icon`;

  /**
   * 1️⃣ meta 파일 생성
   */
  const metaCode = `
export const ${metaName} = {
  viewBox: "${svg.properties.viewBox || "0 0 24 24"}",
  nodes: ${JSON.stringify(nodes, null, 2)},
  groups: ${JSON.stringify([...groups])}
} as const;

export type ${pascalName}GroupName = typeof ${metaName}.groups[number];
`;

  fs.writeFileSync(path.join(OUT, `${pascalName}.meta.ts`), metaCode.trim());

  /**
   * 2️⃣ icon 컴포넌트 생성
   */
  const iconCode = `
import { createIconComponent } from "../../core/createIconComponent";
import { ${metaName} } from "./${pascalName}.meta";

export const ${componentName} = createIconComponent(${metaName});
`;

  fs.writeFileSync(path.join(OUT, `${pascalName}Icon.ts`), iconCode.trim());

  /**
   * index export 수집
   */
  indexExports.push(`export { ${componentName} } from "./${pascalName}Icon";`);
  indexExports.push(`export { ${metaName} } from "./${pascalName}.meta";`);
  indexExports.push(`export type { ${pascalName}GroupName } from "./${pascalName}.meta";`);
});

/**
 * 3️⃣ index.ts merge 관리
 */
const indexPath = path.join(OUT, "index.ts");

let existingExports = new Set<string>();

if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, "utf-8");

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("export")) {
      existingExports.add(trimmed);
    }
  });
}

/**
 * 새 export 추가
 */
indexExports.forEach((exp) => existingExports.add(exp));

/**
 * 정렬
 */
const finalExports = Array.from(existingExports).sort();

/**
 * index.ts 생성
 */
fs.writeFileSync(indexPath, finalExports.join("\n"));

console.log("✅ icons generated successfully");
