import GenIcon from "./GenIcon";

export type IconProps = {
  name: string;
  width?: string;
  height?: string;
  color?: string | string[];
  colorGroup?: { name: string; stroke: string; fill: string }[];
  isActive?: boolean;
  activeColor?: string | string[];
  strokeWidth?: string;
};

export default function Icon({
  name,
  width = "24",
  height = "24",
  color = "currentColor",
  colorGroup = [],
  isActive = false,
  activeColor = "currentColor",
  strokeWidth = "1",
}: IconProps) {
  return (
    <GenIcon
      name={name}
      width={width}
      height={height}
      color={color}
      colorGroup={colorGroup}
      isActive={isActive}
      activeColor={activeColor}
      strokeWidth={strokeWidth}
    />
  );
}
