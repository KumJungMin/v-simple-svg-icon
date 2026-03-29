interface SvgAstNode {
  properties?: {
    viewBox?: string;
  };
}

type FlatNode = {
  tag: string;
  attrs: Record<string, string | number | undefined>;
};

/**  Generates TypeScript code for icon meta. */
export function generateMetaCode(
  metaName: string,
  pascalName: string,
  svg: SvgAstNode,
  nodes: FlatNode[],
  groups: string[]
) {
  const viewBox = svg.properties?.viewBox ?? "0 0 24 24";

  return `
export const ${metaName} = {
  viewBox: "${viewBox}",
  nodes: ${JSON.stringify(nodes, null, 2)},
  groups: ${JSON.stringify(groups)}
} as const;

export type ${pascalName}GroupName = typeof ${metaName}.groups[number];
`.trim();
}

/** Generates icon component code that binds meta to createIconComponent. */
export function generateIconCode(componentName: string, metaName: string, pascalName: string) {
  return `
import { createIconComponent } from "../../core/createIconComponent";
import { ${metaName} } from "./${pascalName}.meta";

export const ${componentName} = createIconComponent(${metaName});
`.trim();
}
