import type { IconProps, ResolvedIconProps } from "./types";

const DEFAULT_WIDTH = "24";
const DEFAULT_HEIGHT = "24";
const DEFAULT_COLOR = "currentColor";
const DEFAULT_ACTIVE_COLOR = "currentColor";
const DEFAULT_STROKE_WIDTH = "1";

export const EMPTY_COLOR_GROUP: NonNullable<IconProps["colorGroup"]> = [];

export function resolveIconProps({
  name,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  color = DEFAULT_COLOR,
  colorGroup = EMPTY_COLOR_GROUP,
  isActive = false,
  activeColor = DEFAULT_ACTIVE_COLOR,
  strokeWidth = DEFAULT_STROKE_WIDTH,
}: IconProps): ResolvedIconProps {
  return {
    name,
    width,
    height,
    color,
    colorGroup,
    isActive,
    activeColor,
    strokeWidth,
  };
}

export function getIconAppearanceKey(props: ResolvedIconProps) {
  return [
    props.width,
    props.height,
    props.isActive ? "1" : "0",
    props.strokeWidth,
    getColorKey(props.color),
    getColorKey(props.activeColor),
    getColorGroupKey(props.colorGroup),
  ].join("\u0002");
}

export function areIconPropsEqual(prev: IconProps, next: IconProps) {
  return (
    prev.name === next.name &&
    (prev.width ?? DEFAULT_WIDTH) === (next.width ?? DEFAULT_WIDTH) &&
    (prev.height ?? DEFAULT_HEIGHT) === (next.height ?? DEFAULT_HEIGHT) &&
    (prev.isActive ?? false) === (next.isActive ?? false) &&
    (prev.strokeWidth ?? DEFAULT_STROKE_WIDTH) === (next.strokeWidth ?? DEFAULT_STROKE_WIDTH) &&
    areColorValuesEqual(prev.color ?? DEFAULT_COLOR, next.color ?? DEFAULT_COLOR) &&
    areColorValuesEqual(
      prev.activeColor ?? DEFAULT_ACTIVE_COLOR,
      next.activeColor ?? DEFAULT_ACTIVE_COLOR
    ) &&
    areColorGroupsEqual(prev.colorGroup ?? EMPTY_COLOR_GROUP, next.colorGroup ?? EMPTY_COLOR_GROUP)
  );
}

export function areResolvedIconPropsEqual(prev: ResolvedIconProps, next: ResolvedIconProps) {
  return (
    prev.name === next.name &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.isActive === next.isActive &&
    prev.strokeWidth === next.strokeWidth &&
    areColorValuesEqual(prev.color, next.color) &&
    areColorValuesEqual(prev.activeColor, next.activeColor) &&
    areColorGroupsEqual(prev.colorGroup, next.colorGroup)
  );
}

function areColorValuesEqual(prev: string | string[], next: string | string[]) {
  if (Array.isArray(prev) || Array.isArray(next)) {
    return (
      Array.isArray(prev) &&
      Array.isArray(next) &&
      prev.length === next.length &&
      prev.every((value, index) => value === next[index])
    );
  }

  return prev === next;
}

function areColorGroupsEqual(
  prev: NonNullable<IconProps["colorGroup"]>,
  next: NonNullable<IconProps["colorGroup"]>
) {
  return (
    prev.length === next.length &&
    prev.every((item, index) => {
      const nextItem = next[index];
      return (
        item.name === nextItem.name &&
        item.fill === nextItem.fill &&
        item.stroke === nextItem.stroke
      );
    })
  );
}

function getColorKey(color: string | string[]) {
  return Array.isArray(color) ? color.join("\u0000") : color;
}

function getColorGroupKey(colorGroup: NonNullable<IconProps["colorGroup"]>) {
  return colorGroup
    .map(({ name, fill, stroke }) => `${name}\u0000${fill}\u0000${stroke}`)
    .join("\u0001");
}
