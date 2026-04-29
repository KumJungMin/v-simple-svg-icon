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

export type ResolvedIconProps = Required<IconProps>;
