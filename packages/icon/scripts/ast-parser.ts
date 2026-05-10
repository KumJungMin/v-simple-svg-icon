import { parse } from "svg-parser";

interface SvgAstNode {
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: SvgAstNode[];
}

type SvgAttrs = Record<string, string | number | undefined>;

const SUPPORTED_ICON_TAGS = new Set(["path"]);

/** Extracts the root <svg> node from raw SVG string. */
export function extractSvgTree(raw: string): SvgAstNode | undefined {
  const parsed = parse(raw) as { children?: SvgAstNode[] };

  return parsed.children?.find((node) => node.tagName === "svg");
}

/**
 * Collects supported icon nodes from a path-only SVG tree.
 */
export function flattenSvg(svg: SvgAstNode, sourceName = "svg") {
  const nodes: Array<{ tag: string; attrs: SvgAttrs }> = [];
  const groups = new Set<string>();

  collectNodes(svg.children ?? [], nodes, groups, sourceName);

  return {
    nodes,
    groups: [...groups],
  };
}

function collectNodes(
  children: SvgAstNode[],
  nodes: Array<{ tag: string; attrs: SvgAttrs }>,
  groups: Set<string>,
  sourceName: string
) {
  for (const node of children) {
    const { tagName } = node;
    if (!tagName) continue;

    if (!SUPPORTED_ICON_TAGS.has(tagName)) {
      throw new Error(`Unsupported SVG tag <${tagName}> in ${sourceName}. Only <path> icons are supported.`);
    }

    if (hasElementChildren(node.children)) {
      throw new Error(`Nested SVG elements under <${tagName}> are not supported in ${sourceName}.`);
    }

    const attrs = toSvgAttrs(node.properties);
    const group = attrs["data-color-group"];

    if (typeof group === "string") {
      groups.add(group);
    }

    nodes.push({ tag: tagName, attrs });
  }
}

function hasElementChildren(children: SvgAstNode[] | undefined) {
  return (children ?? []).some((child) => child.tagName);
}

function toSvgAttrs(properties: Record<string, unknown> | undefined): SvgAttrs {
  const attrs: SvgAttrs = {};

  for (const [key, value] of Object.entries(properties ?? {})) {
    if (typeof value === "string" || typeof value === "number") {
      attrs[key] = value;
    }
  }

  return attrs;
}
