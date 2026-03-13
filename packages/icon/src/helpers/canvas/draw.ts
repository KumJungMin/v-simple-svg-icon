import type { CreateCacheStore } from "../../composables/useSvgCacheStore";

export type DrawCanvasIconOptions = {
  name: string;
  fill?: string;
  stroke?: string;
  size?: number;
  x: number;
  y: number;
};

type DrawTargetContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const DEFAULT_SIZE = 24;

const sourceSvgCache = new Map<string, string>();
const parsedIconCache = new Map<string, ParsedSvgIcon>();
const spriteCache = new Map<string, OffscreenCanvas>();

type ParsedSvgIcon = {
  viewBox: { width: number; height: number };
  paths: {
    path: Path2D;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }[];
};

function makeSpriteKey(
  name: string,
  fill: string | undefined,
  stroke: string | undefined,
  size: number,
  dpr: number
) {
  return `${name}|${fill ?? "d"}|${stroke ?? "d"}|${size}|${dpr}`;
}

async function readSvg(name: string, store: CreateCacheStore) {
  const cached = sourceSvgCache.get(name);
  if (cached) return cached;

  const svg = store.svgCache.value.get(name) ?? (await store.loadSvg(name));

  sourceSvgCache.set(name, svg);

  return svg;
}

function parseSvg(svgText: string): ParsedSvgIcon {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");

  const svg = doc.querySelector("svg");

  if (!svg) throw new Error("invalid svg");

  const viewBox = svg.getAttribute("viewBox") ?? "0 0 24 24";

  const [, , width, height] = viewBox.split(/\s+/).map(Number);

  const paths: ParsedSvgIcon["paths"] = [];

  svg.querySelectorAll("path").forEach((p) => {
    const d = p.getAttribute("d");

    if (!d) return;

    paths.push({
      path: new Path2D(d),
      fill: p.getAttribute("fill") ?? undefined,
      stroke: p.getAttribute("stroke") ?? undefined,
      strokeWidth: p.getAttribute("stroke-width")
        ? Number(p.getAttribute("stroke-width"))
        : undefined,
    });
  });

  return {
    viewBox: { width, height },
    paths,
  };
}

async function getParsedIcon(name: string, store: CreateCacheStore): Promise<ParsedSvgIcon> {
  const cached = parsedIconCache.get(name);

  if (cached) return cached;

  const svg = await readSvg(name, store);

  const parsed = parseSvg(svg);

  parsedIconCache.set(name, parsed);

  return parsed;
}

function renderSprite(icon: ParsedSvgIcon, size: number, fill?: string, stroke?: string) {
  const dpr = globalThis.devicePixelRatio || 1;

  const canvas = new OffscreenCanvas(size * dpr, size * dpr);

  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("context failed");

  ctx.scale(dpr, dpr);

  const scale = size / icon.viewBox.width;

  ctx.scale(scale, scale);

  for (const p of icon.paths) {
    const fillColor = fill ?? p.fill;
    const strokeColor = stroke ?? p.stroke;

    if (fillColor && fillColor !== "none") {
      ctx.fillStyle = fillColor;
      ctx.fill(p.path);
    }

    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = p.strokeWidth ?? 1;
      ctx.stroke(p.path);
    }
  }

  return canvas;
}

async function getSprite(
  name: string,
  fill: string | undefined,
  stroke: string | undefined,
  size: number,
  store: CreateCacheStore
) {
  const dpr = globalThis.devicePixelRatio || 1;

  const key = makeSpriteKey(name, fill, stroke, size, dpr);

  const cached = spriteCache.get(key);

  if (cached) return cached;

  const icon = await getParsedIcon(name, store);

  const sprite = renderSprite(icon, size, fill, stroke);

  spriteCache.set(key, sprite);

  return sprite;
}

export async function drawCanvasIcon(
  ctx: DrawTargetContext,
  options: DrawCanvasIconOptions,
  store: CreateCacheStore
) {
  const size = options.size ?? DEFAULT_SIZE;

  const sprite = await getSprite(options.name, options.fill, options.stroke, size, store);

  ctx.drawImage(sprite, options.x, options.y, size, size);
}

export function clearCanvasIconCache() {
  sourceSvgCache.clear();
  parsedIconCache.clear();
  spriteCache.clear();
}
