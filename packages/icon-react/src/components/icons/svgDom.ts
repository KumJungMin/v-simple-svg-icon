import type { ResolvedIconProps } from "./types";

const STROKE_CLASS = "svg-stroke";
const FILL_CLASS = "svg-fill";
const STROKE_WIDTH_ATTR = "stroke-width";

export function createIconInstanceSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getIconClassName(name: string) {
  return `i-${name || "icon"}`;
}

export function parseSvgElement(svgText: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  return doc.querySelector("svg");
}

export function syncSvgElement(
  svgElement: SVGElement,
  props: ResolvedIconProps,
  iconClassName: string,
  uniqueId: string
) {
  svgElement.setAttribute("width", props.width || "24");
  svgElement.setAttribute("height", props.height || "24");
  svgElement.style.display = "block";
  svgElement.classList.add(iconClassName, uniqueId);

  updateSvgAttributes(svgElement, props);
  applyStyle(svgElement, props, iconClassName, uniqueId);
}

function updateSvgAttributes(svgElement: SVGElement, props: ResolvedIconProps) {
  svgElement.querySelectorAll<SVGPathElement>("[stroke], [fill]").forEach((path) => {
    const hasStroke = path.hasAttribute("stroke") && path.getAttribute("stroke") !== "none";
    const hasFill = path.hasAttribute("fill") && path.getAttribute("fill") !== "none";

    if (hasStroke) {
      path.classList.add(STROKE_CLASS);
      if (props.strokeWidth) path.setAttribute(STROKE_WIDTH_ATTR, props.strokeWidth);
      else path.removeAttribute(STROKE_WIDTH_ATTR);
    }
    if (hasFill) path.classList.add(FILL_CLASS);
    path.classList.toggle("active", props.isActive);

    const groupName = path.dataset?.colorGroup;
    if (groupName) path.classList.add(`color-group-${groupName}`);
  });
}

function applyStyle(
  svgElement: SVGElement,
  props: ResolvedIconProps,
  iconClassName: string,
  uniqueId: string
) {
  let styleElement = svgElement.querySelector("style[data-gen-icon]");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.setAttribute("data-gen-icon", "true");
    svgElement.insertBefore(styleElement, svgElement.firstChild);
  }

  styleElement.textContent = getSvgStyleContent(props, iconClassName, uniqueId);
}

function getSvgStyleContent(props: ResolvedIconProps, iconClassName: string, uniqueId: string) {
  const strokeColor = Array.isArray(props.color) ? props.color[0] : props.color;
  const fillColor = Array.isArray(props.color) ? props.color[1] : props.color;
  const strokeActiveColor = Array.isArray(props.activeColor)
    ? props.activeColor[0]
    : props.activeColor || strokeColor;
  const fillActiveColor = Array.isArray(props.activeColor)
    ? props.activeColor[1]
    : props.activeColor || fillColor;

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

  return rules.join(" ");
}
