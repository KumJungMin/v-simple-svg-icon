import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { CreateCacheStore, useSvgCacheStoreContext } from "../../composables/useSvgCacheStore";
import type { IconProps } from "./Icon";

const STROKE_CLASS = "svg-stroke";
const FILL_CLASS = "svg-fill";
const STROKE_WIDTH_ATTR = "stroke-width";

export default function GenIcon(props: Required<IconProps>) {
  const svgCacheStore = useSvgCacheStoreContext();
  const [isSvgLoading, setIsSvgLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const iconClassName = `i-${props.name || "icon"}`;
  const uniqueId = useMemo(() => `${iconClassName}-${Date.now()}-${Math.random().toString(36).slice(2)}`, [iconClassName]);

  const defaultStyle: CSSProperties = useMemo(
    () => ({ cursor: "pointer", display: "inline-block", width: `${props.width}px`, height: `${props.height}px` }),
    [props.width, props.height]
  );

  useEffect(() => {
    if (!svgCacheStore) throw new Error("SVG Cache Store is not provided!");
  }, [svgCacheStore]);

  useEffect(() => {
    if (!props.name || !svgCacheStore) return;

    let cancelled = false;
    const render = async (store: CreateCacheStore) => {
      const svg = await store.loadSvg(props.name);
      if (cancelled) return;
      setIsSvgLoading(false);
      insertSvgIntoDom(svg);
    };

    setIsSvgLoading(true);
    render(svgCacheStore).catch(() => setIsSvgLoading(true));

    return () => {
      cancelled = true;
      svgCacheStore.removeSvg(props.name);
    };
  }, [props, svgCacheStore]);

  function insertSvgIntoDom(svgText: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    if (!svgElement || !containerRef.current) return;

    svgElement.setAttribute("width", props.width || "24");
    svgElement.setAttribute("height", props.height || "24");
    svgElement.style.display = "block";
    svgElement.classList.add(iconClassName, uniqueId);

    updateSvgAttributes(svgElement);
    applyStyle(svgElement);

    containerRef.current.replaceChildren(svgElement);
  }

  function updateSvgAttributes(svgElement: SVGElement) {
    svgElement.querySelectorAll<SVGPathElement>("[stroke], [fill]").forEach((path) => {
      const hasStroke = path.hasAttribute("stroke") && path.getAttribute("stroke") !== "none";
      const hasFill = path.hasAttribute("fill") && path.getAttribute("fill") !== "none";

      if (hasStroke && props.strokeWidth) {
        path.classList.add(STROKE_CLASS);
        path.setAttribute(STROKE_WIDTH_ATTR, props.strokeWidth);
      }
      if (hasFill) path.classList.add(FILL_CLASS);
      if (props.isActive) path.classList.add("active");
      else path.classList.remove("active");

      const groupName = path.dataset?.colorGroup;
      if (groupName) path.classList.add(`color-group-${groupName}`);
    });
  }

  function applyStyle(svgElement: SVGElement) {
    let styleElement = svgElement.querySelector("style[data-gen-icon]");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.setAttribute("data-gen-icon", "true");
      svgElement.insertBefore(styleElement, svgElement.firstChild);
    }

    const strokeColor = Array.isArray(props.color) ? props.color[0] : props.color;
    const fillColor = Array.isArray(props.color) ? props.color[1] : props.color;
    const strokeActiveColor = Array.isArray(props.activeColor) ? props.activeColor[0] : props.activeColor || strokeColor;
    const fillActiveColor = Array.isArray(props.activeColor) ? props.activeColor[1] : props.activeColor || fillColor;

    const svgClass = `svg.${iconClassName}.${uniqueId}`;
    const rules = [
      `${svgClass} .${STROKE_CLASS} { stroke: ${strokeColor}; }`,
      `${svgClass} .${STROKE_CLASS}.active { stroke: ${strokeActiveColor}; }`,
      `${svgClass} .${FILL_CLASS} { fill: ${fillColor}; }`,
      `${svgClass} .${FILL_CLASS}.active { fill: ${fillActiveColor}; }`,
    ];

    props.colorGroup.forEach(({ name, fill, stroke }) => {
      const groupClass = `color-group-${name}`;
      if (fill) rules.push(`${svgClass} .${groupClass} { fill: ${fill} !important; }`);
      if (stroke) rules.push(`${svgClass} .${groupClass} { stroke: ${stroke} !important; }`);
    });

    styleElement.textContent = rules.join(" ");
  }

  return (
    <div style={{ position: "relative", ...defaultStyle }}>
      {isSvgLoading ? (
        <div
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "#e0e0e0" }}
        />
      ) : null}
      <div ref={containerRef} style={defaultStyle} />
    </div>
  );
}
