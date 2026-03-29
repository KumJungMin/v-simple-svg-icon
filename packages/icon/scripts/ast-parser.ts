import { parse } from "svg-parser";

/**
 * Minimal SVG AST node type (from svg-parser)
 */
interface SvgAstNode {
  tagName?: string;
  properties?: Record<string, any>;
  children?: SvgAstNode[];
}

interface SvgAstNode {
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: SvgAstNode[];
}

type SvgAttrs = Record<string, string | number | undefined>;

/** Extracts the root <svg> node from raw SVG string. */
export function extractSvgTree(raw: string): SvgAstNode | undefined {
  const parsed = parse(raw) as { children: SvgAstNode[] };

  return parsed.children.find((node) => node.tagName === "svg");
}

/**
 * Flattens an SVG AST into a linear structure.
 *
 * Input (tree):
 * svg
 *  ├─ g
 *  │   └─ path
 *  └─ path
 *
 * Output:
 * {
 *   nodes: [
 *     { tag: "g", attrs: {...} },
 *     { tag: "path", attrs: {...} },
 *     { tag: "path", attrs: {...} }
 *   ],
 *   groups: ["primary", "secondary"]
 * }
 */
export function flattenSvg(svg: SvgAstNode) {
  const nodes: Array<{ tag: string; attrs: SvgAttrs }> = [];
  const groups = new Set<string>();

  collectNodes(svg.children ?? [], nodes, groups);

  return {
    nodes,
    groups: [...groups],
  };
}

function collectNodes(
  children: SvgAstNode[],
  nodes: Array<{ tag: string; attrs: SvgAttrs }>,
  groups: Set<string>
) {
  for (const node of children) {
    if (!node.tagName) continue;

    const attrs: SvgAttrs = (node.properties ?? {}) as SvgAttrs;

    const group = attrs["data-color-group"];
    if (typeof group === "string") {
      groups.add(group);
    }

    nodes.push({ tag: node.tagName, attrs });

    if (node.children?.length) {
      collectNodes(node.children, nodes, groups);
    }
  }
}
