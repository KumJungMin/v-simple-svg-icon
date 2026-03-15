import type { CreateCacheStore } from "../../composables/useSvgCacheStore";

/**
 * Canvas 아이콘 렌더링 옵션
 *
 * name   : 아이콘 이름 (SVG 파일명)
 * fill   : fill 색상 override
 * stroke : stroke 색상 override
 * size   : 아이콘 크기
 * x,y    : canvas에 그릴 좌표
 */
export type DrawCanvasIconOptions = {
  name: string;
  fill?: string;
  stroke?: string;
  size?: number;
  x: number;
  y: number;
};

/**
 * ================================================
 *  Canvas Icon Rendering Pipeline
 * ================================================
 *
 * SVG 파일
 *   ↓
 * sourceSvgCache (SVG 문자열 캐시)
 *   ↓
 * parsedIconCache (SVG → Path2D 파싱 캐시)
 *   ↓
 * spriteCache (Canvas sprite 캐시)
 *   ↓
 * ctx.drawImage()
 *
 * 목적
 * - SVG 파싱 비용 제거
 * - Path2D 생성 비용 제거
 * - Canvas path 렌더링 제거
 */
type DrawTargetContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const DEFAULT_SIZE = 24;

const sourceSvgCache = new Map<string, string>(); // SVG 파일명 → SVG 문자열 캐시 (fetch 또는 store에서 로드된 SVG)
const parsedIconCache = new Map<string, ParsedSvgIcon>(); // SVG → Path2D 변환 결과를 저장
const spriteCache = new Map<string, OffscreenCanvas>(); // 최종 Canvas sprite 캐시 (아이콘 이름 + fill + stroke + size + dpr 조합) Canvas path 렌더링 비용 제거

type ParsedSvgIcon = {
  viewBox: { width: number; height: number };
  paths: {
    path: Path2D;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }[];
};

export function clearCanvasIconCache() {
  sourceSvgCache.clear();
  parsedIconCache.clear();
  spriteCache.clear();
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

  if (cached) {
    return cached;
  } else {
    const icon = await getParsedIcon(name, store);
    const sprite = renderSprite(icon, size, fill, stroke);
    spriteCache.set(key, sprite);
    return sprite;
  }
}

async function getParsedIcon(name: string, store: CreateCacheStore): Promise<ParsedSvgIcon> {
  const cached = parsedIconCache.get(name);

  if (cached) {
    return cached;
  } else {
    const svg = await readSvg(name, store);
    const parsed = parseSvg(svg);
    parsedIconCache.set(name, parsed);

    return parsed;
  }
}

function makeSpriteKey(
  name: string,
  fill: string | undefined,
  stroke: string | undefined,
  size: number,
  dpr: number
) {
  return `${name}|${fill ?? "d"}|${stroke ?? "d"}|${size}|${dpr}`;
}

/**
 * SVG 문자열을 가져오는 함수
 *
 * 우선순위
 * sourceSvgCache >  SvgCacheStore > loadSvg()
 */
async function readSvg(name: string, store: CreateCacheStore) {
  const cached = sourceSvgCache.get(name);
  if (cached) return cached;

  const svg = store.svgCache.value.get(name) ?? (await store.loadSvg(name));

  sourceSvgCache.set(name, svg);

  return svg;
}

/**
 * OffscreenCanvas에 아이콘을 렌더링한다. (offscreenCanvas는 메인 스레드의 렌더링에 영향을 주지 않고 백그라운드에서 작업할 수 있음.)
 * 실제 Canvas path 렌더링이 수행된다.
 */
function renderSprite(icon: ParsedSvgIcon, size: number, fill?: string, stroke?: string) {
  const dpr = globalThis.devicePixelRatio || 1;
  const canvas = new OffscreenCanvas(size * dpr, size * dpr);
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("context failed");

  ctx.scale(dpr, dpr);
  const scale = size / icon.viewBox.width;
  ctx.scale(scale, scale);

  for (const path of icon.paths) {
    const fillColor = fill ?? path.fill;
    const strokeColor = stroke ?? path.stroke;

    if (fillColor && fillColor !== "none") {
      ctx.fillStyle = fillColor;
      ctx.fill(path.path);
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = path.strokeWidth ?? 1;
      ctx.stroke(path.path);
    }
  }
  return canvas;
}

/**
 * SVG 문자열을 Canvas 렌더링 가능한 구조로 파싱한다.
 *
 * 처리 과정
 * SVG text ->  DOMParser -> path 추출 -> Path2D 생성
 *
 * 결과
 * Canvas에서 바로 사용할 수 있는 ParsedSvgIcon
 */
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

    const strokeWidth = p.getAttribute("stroke-width")
      ? Number(p.getAttribute("stroke-width"))
      : undefined;

    paths.push({
      path: new Path2D(d),
      fill: p.getAttribute("fill") ?? undefined,
      stroke: p.getAttribute("stroke") ?? undefined,
      strokeWidth: strokeWidth,
    });
  });

  return {
    viewBox: { width, height },
    paths,
  };
}
