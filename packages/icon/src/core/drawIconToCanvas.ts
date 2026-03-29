interface CanvasIconNode {
  tag: string;
  attrs: {
    d?: string;
    fill?: string;
    stroke?: string;
  };
}

interface CanvasIconMeta {
  viewBox: string;
  nodes: readonly CanvasIconNode[];
}

interface DrawIconOptions {
  size?: number;
  fill?: string;
  stroke?: string;
}

export function drawIconToCanvas(
  ctx: CanvasRenderingContext2D,
  meta: CanvasIconMeta,
  options: DrawIconOptions = {}
): void {
  const size = options.size ?? 24;
  const [, , vbW] = meta.viewBox.split(" ").map(Number);
  if (!vbW) return;
  const scale = size / vbW;

  ctx.save();
  ctx.scale(scale, scale);

  for (const node of meta.nodes) {
    if (node.tag === "path") {
      const d = node.attrs.d;
      if (!d) continue;

      const p = new Path2D(d);
      if (node.attrs.fill && node.attrs.fill !== "none") {
        ctx.fillStyle = options.fill || "black";
        ctx.fill(p);
      }
      if (node.attrs.stroke && node.attrs.stroke !== "none") {
        ctx.strokeStyle = options.stroke || "black";
        ctx.stroke(p);
      }
    }
  }
  ctx.restore();
}
