import { createElement, forwardRef, type SVGProps } from "react";

type IconColor = string | readonly [string, string];

export interface IconColorGroup {
  name: string;
  stroke?: string;
  fill?: string;
}

interface IconNodeAttrs {
  d?: string;
  fill?: string;
  stroke?: string;
  "data-color-group"?: string;
  [key: string]: string | number | undefined;
}

interface IconNode {
  tag: string;
  attrs: IconNodeAttrs;
}

interface IconMeta {
  viewBox: string;
  nodes: readonly IconNode[];
}

export type IconProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  color?: IconColor;
  activeColor?: IconColor;
  isActive?: boolean;
  colorGroup?: IconColorGroup[];
};

type IconRenderContext = {
  strokeColor: string;
  fillColor: string;
  strokeWidth?: SVGProps<SVGSVGElement>["strokeWidth"];
  colorGroup: IconColorGroup[];
};

export function createIconComponent(meta: IconMeta) {
  return forwardRef<SVGSVGElement, IconProps>(function IconComponent(
    {
      width = 24,
      height = 24,
      color = "currentColor",
      activeColor = "currentColor",
      isActive = false,
      strokeWidth,
      colorGroup = [],
      ...svgProps
    },
    ref
  ) {
    const [strokeColor, fillColor] = getCurrentColors({ color, activeColor, isActive });

    const ctx = {
      strokeColor,
      fillColor,
      strokeWidth,
      colorGroup,
    };

    return createElement(
      "svg",
      {
        ...svgProps,
        ref,
        viewBox: meta.viewBox,
        width,
        height,
        fill: svgProps.fill ?? "none",
      },
      meta.nodes.map((node, index) =>
        createElement(node.tag, {
          ...resolveNodeAttrs(node.attrs, ctx),
          key: `${node.tag}-${index}`,
        })
      )
    );
  });
}

/**
 * resolve node attributes based on current context (colors, stroke width, color groups)
 * - if stroke/fill is defined and not "none", apply current stroke/fill color from context
 * - if data-color-group is defined, apply colors from the corresponding color group in context
 * */
function resolveNodeAttrs(nodeAttrs: IconNodeAttrs, ctx: IconRenderContext) {
  const resolved = { ...nodeAttrs };

  const hasStroke = resolved.stroke && resolved.stroke !== "none";
  const hasFill = resolved.fill && resolved.fill !== "none";

  if (hasStroke) {
    resolved.stroke = ctx.strokeColor;
    if (ctx.strokeWidth !== undefined) {
      resolved["stroke-width"] = ctx.strokeWidth;
    }
  }
  if (hasFill) {
    resolved.fill = ctx.fillColor;
  }

  applyColorGroup(resolved, ctx.colorGroup);

  return normalizeAttrs(resolved);
}

/**
 * If the svg has color groups, apply the colors from the group to the node attributes.
 * the color group colors will override the stroke/fill colors from props.
 * */
function applyColorGroup(
  attrs: Record<string, string | number | undefined>,
  colorGroup: IconColorGroup[]
) {
  const groupName = attrs["data-color-group"];
  if (!groupName) return;

  const group = colorGroup.find((g) => g.name === groupName);
  if (!group) return;

  if (group.stroke) attrs.stroke = group.stroke;
  if (group.fill) attrs.fill = group.fill;
}

/**
 * get current colors based on active state
 */
function getCurrentColors(props: Pick<IconProps, "color" | "activeColor" | "isActive">): [string, string] {
  const base = normalizeColor(props.color);
  const active = normalizeColor(props.activeColor);
  return props.isActive ? active : base;
}

/**
 * convert to stroke/fill pair, applying defaults
 * */
function normalizeColor(color: IconColor | undefined): [string, string] {
  if (typeof color === "string") {
    return [color, color];
  }

  if (Array.isArray(color)) {
    const stroke = color[0] ?? "currentColor";
    const fill = color[1] ?? stroke;
    return [stroke, fill];
  }

  return ["currentColor", "currentColor"];
}

function normalizeAttrs(attrs: Record<string, string | number | undefined>) {
  const normalized: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    normalized[toReactAttrName(key)] = value;
  }

  return normalized;
}

function toReactAttrName(attrName: string) {
  if (attrName === "class") return "className";
  if (attrName.startsWith("data-") || attrName.startsWith("aria-")) return attrName;

  return attrName.replace(/[:-]([a-z])/g, (_, char: string) => char.toUpperCase());
}
