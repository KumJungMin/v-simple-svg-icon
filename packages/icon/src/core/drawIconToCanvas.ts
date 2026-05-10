interface CanvasIconNode {
  tag: string;
  attrs: {
    d?: string;
    fill?: string;
    stroke?: string;
    "stroke-width"?: string | number;
    "stroke-linecap"?: string;
    "stroke-linejoin"?: string;
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

/**
 * Draws an SVG icon onto a canvas context based on the provided metadata and options.
 *
 * @param ctx - The canvas rendering context to draw on.
 * @param meta - The metadata describing the SVG icon, including viewBox and nodes.
 * @param options - Optional settings for drawing, such as size, fill color, and stroke color.
 * */
export function drawIconToCanvas(
  ctx: CanvasRenderingContext2D,
  meta: CanvasIconMeta,
  options: DrawIconOptions = {}
): void {
  const size = options.size ?? 24;
  const scale = getScale(meta.viewBox, size);

  if (!scale) return;

  ctx.save();
  ctx.scale(scale, scale);

  for (const node of meta.nodes) {
    renderNode(ctx, node, options);
  }

  ctx.restore();
}

function getScale(viewBox: string, size: number): number | null {
  const [, , width] = viewBox.split(" ").map(Number);
  if (!width) return null;
  return size / width;
}

function renderNode(ctx: CanvasRenderingContext2D, node: CanvasIconNode, options: DrawIconOptions) {
  if (node.tag !== "path") return;

  const d = node.attrs.d; // 'd' is the SVG path data string that defines how the shape is drawn.
  if (!d) return;

  const styles = resolveDrawStyles(node, options);
  drawPath(ctx, d, styles);
}

function resolveDrawStyles(node: CanvasIconNode, options: DrawIconOptions) {
  const hasFill = node.attrs.fill && node.attrs.fill !== "none";
  const hasStroke = node.attrs.stroke && node.attrs.stroke !== "none";
  return {
    fill: hasFill ? (options.fill ?? "black") : null,
    stroke: hasStroke ? (options.stroke ?? "black") : null,
    lineWidth: getLineWidth(node.attrs["stroke-width"]),
    lineCap: getLineCap(node.attrs["stroke-linecap"]),
    lineJoin: getLineJoin(node.attrs["stroke-linejoin"]),
  };
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  d: string,
  styles: {
    fill: string | null;
    stroke: string | null;
    lineWidth: number;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
  }
) {
  const path = new Path2D(d);
  if (styles.fill) {
    ctx.fillStyle = styles.fill;
    ctx.fill(path);
  }
  if (styles.stroke) {
    ctx.strokeStyle = styles.stroke;
    ctx.lineWidth = styles.lineWidth;
    ctx.lineCap = styles.lineCap;
    ctx.lineJoin = styles.lineJoin;
    ctx.stroke(path);
  }
}

function getLineWidth(value: string | number | undefined) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 1;
}

function getLineCap(value: string | undefined): CanvasLineCap {
  if (value === "round" || value === "square") return value;
  return "butt";
}

function getLineJoin(value: string | undefined): CanvasLineJoin {
  if (value === "round" || value === "bevel") return value;
  return "miter";
}
