import { memo } from "react";
import GenIcon from "./GenIcon";
import { areIconPropsEqual, resolveIconProps } from "./iconProps";
import type { IconProps } from "./types";

export type { IconProps } from "./types";

function Icon(props: IconProps) {
  return <GenIcon {...resolveIconProps(props)} />;
}

export default memo(Icon, areIconPropsEqual);
