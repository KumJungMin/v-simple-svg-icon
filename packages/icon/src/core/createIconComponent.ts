import { defineComponent, h, type PropType } from "vue";

type IconColor = string | [string, string];

interface IconColorGroup {
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

type IconProps = {
  width: string;
  height: string;
  color: IconColor;
  activeColor: IconColor;
  isActive: boolean;
  strokeWidth: string;
  colorGroup: IconColorGroup[];
};

type IconRenderContext = {
  strokeColor: string;
  fillColor: string;
  strokeWidth: string;
  colorGroup: IconColorGroup[];
};

export function createIconComponent(meta: IconMeta) {
  const props = {
    width: { type: String, default: "24" },
    height: { type: String, default: "24" },
    color: { type: [String, Array] as PropType<IconColor>, default: "currentColor" },
    activeColor: { type: [String, Array] as PropType<IconColor>, default: "currentColor" },
    isActive: { type: Boolean, default: false },
    strokeWidth: { type: String, default: "1" },
    colorGroup: { type: Array as PropType<IconColorGroup[]>, default: () => [] },
  } as const;

  return defineComponent({
    props,

    setup(props: IconProps) {
      const renderNodes = createNodeRenderer(meta);
      const renderSvg = createSvgRenderer(meta);

      return () => {
        const [strokeColor, fillColor] = getCurrentColors(props);

        const ctx = {
          strokeColor,
          fillColor,
          strokeWidth: props.strokeWidth,
          colorGroup: props.colorGroup,
        };
        const nodes = renderNodes(ctx);
        return renderSvg(props, nodes);
      };
    },
  });
}

function createNodeRenderer(meta: IconMeta) {
  return function renderNodes(ctx: IconRenderContext) {
    return meta.nodes.map((node, i) =>
      h(node.tag, {
        ...resolveNodeAttrs(node.attrs, ctx),
        key: i,
      })
    );
  };
}

function createSvgRenderer(meta: IconMeta) {
  return function renderSvg(props: IconProps, children: any[]) {
    return h(
      "svg",
      {
        viewBox: meta.viewBox,
        width: props.width,
        height: props.height,
        fill: "none",
      },
      children
    );
  };
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
    resolved["stroke-width"] = ctx.strokeWidth;
  }
  if (hasFill) {
    resolved.fill = ctx.fillColor;
  }

  applyColorGroup(resolved, ctx.colorGroup);

  return resolved;
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
function getCurrentColors(props: IconProps): [string, string] {
  const base = normalizeColor(props.color);
  const active = normalizeColor(props.activeColor);
  return props.isActive ? active : base;
}

/**
 * convert to stroke/fill pair, applying defaults
 * */
function normalizeColor(color: IconColor): [string, string] {
  if (Array.isArray(color)) {
    const stroke = color[0] ?? "currentColor";
    const fill = color[1] ?? stroke;
    return [stroke, fill];
  }
  return [color, color];
}
