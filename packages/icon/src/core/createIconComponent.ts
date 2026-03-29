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

function toColorPair(color: IconColor): [string, string] {
  if (Array.isArray(color)) {
    return [color[0] ?? "currentColor", color[1] ?? color[0] ?? "currentColor"];
  }
  return [color, color];
}

export function createIconComponent(meta: IconMeta) {
  return defineComponent({
    props: {
      width: { type: String, default: "24" },
      height: { type: String, default: "24" },
      color: { type: [String, Array] as PropType<IconColor>, default: "currentColor" },
      activeColor: { type: [String, Array] as PropType<IconColor>, default: "currentColor" },
      isActive: { type: Boolean, default: false },
      strokeWidth: { type: String, default: "1" },
      colorGroup: { type: Array as PropType<IconColorGroup[]>, default: () => [] },
    },
    setup(props) {
      function resolve(attrs: IconNodeAttrs): Record<string, string | number | undefined> {
        const next: Record<string, string | number | undefined> = { ...attrs };
        const [s, f] = toColorPair(props.color);
        const [sa, fa] = toColorPair(props.activeColor);

        if (next.stroke && next.stroke !== "none") {
          next.stroke = props.isActive ? sa : s;
          next["stroke-width"] = props.strokeWidth;
        }
        if (next.fill && next.fill !== "none") {
          next.fill = props.isActive ? fa : f;
        }
        const group = next["data-color-group"];
        if (group) {
          const found = props.colorGroup.find((g) => g.name === group);
          if (found?.stroke) next.stroke = found.stroke;
          if (found?.fill) next.fill = found.fill;
        }
        return next;
      }

      return () =>
        h(
          "svg",
          {
            viewBox: meta.viewBox,
            width: props.width,
            height: props.height,
            fill: "none",
          },
          meta.nodes.map((node) => h(node.tag, resolve(node.attrs)))
        );
    },
  });
}
