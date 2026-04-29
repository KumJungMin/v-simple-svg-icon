import { CSSProperties, memo, useEffect, useMemo, useRef, useState } from "react";
import { CreateCacheStore, useSvgCacheStoreContext } from "../../composables/useSvgCacheStore";
import { areResolvedIconPropsEqual, getIconAppearanceKey } from "./iconProps";
import {
  createIconInstanceSuffix,
  getIconClassName,
  parseSvgElement,
  syncSvgElement,
} from "./svgDom";
import type { ResolvedIconProps } from "./types";

const LOADING_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "#e0e0e0",
};

function GenIcon(props: ResolvedIconProps) {
  const { name, width, height } = props;

  const svgCacheStore = useRequiredSvgCacheStore();
  const [isSvgLoading, setIsSvgLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgElementRef = useRef<SVGElement | null>(null);
  const renderedNameRef = useRef<string | null>(null);
  const latestPropsRef = useRef<ResolvedIconProps>(props);
  const uniqueSuffixRef = useRef<string | null>(null);

  if (!uniqueSuffixRef.current) uniqueSuffixRef.current = createIconInstanceSuffix();

  latestPropsRef.current = props;

  const iconClassName = useMemo(() => getIconClassName(name), [name]);
  const uniqueId = useMemo(() => `${iconClassName}-${uniqueSuffixRef.current}`, [iconClassName]);
  const iconAppearanceKey = getIconAppearanceKey(props);

  const iconStyle: CSSProperties = useMemo(
    () => ({
      cursor: "pointer",
      display: "inline-block",
      width: `${width}px`,
      height: `${height}px`,
    }),
    [width, height]
  );
  const wrapperStyle: CSSProperties = useMemo(
    () => ({ position: "relative", ...iconStyle }),
    [iconStyle]
  );

  useEffect(() => {
    if (!name) {
      renderedNameRef.current = null;
      svgElementRef.current = null;
      containerRef.current?.replaceChildren();
      setIsSvgLoading(false);
      return;
    }

    let cancelled = false;
    const render = async (store: CreateCacheStore) => {
      setIsSvgLoading(!store.svgCache.has(name));

      const svg = await store.loadSvg(name);
      if (cancelled) return;

      const svgElement = parseSvgElement(svg);
      if (!svgElement) {
        throw new Error(`Invalid SVG content: ${name}`);
      }

      syncSvgElement(svgElement, latestPropsRef.current, iconClassName, uniqueId);

      svgElementRef.current = svgElement;
      renderedNameRef.current = name;
      containerRef.current?.replaceChildren(svgElement);
      setIsSvgLoading(false);
    };

    render(svgCacheStore).catch((error) => {
      if (cancelled) return;
      console.error("Error rendering SVG icon:", error);
      svgElementRef.current = null;
      renderedNameRef.current = null;
      containerRef.current?.replaceChildren();
      setIsSvgLoading(false);
    });

    return () => {
      cancelled = true;
      svgCacheStore.removeSvg(name);
    };
  }, [iconClassName, name, svgCacheStore, uniqueId]);

  useEffect(() => {
    if (renderedNameRef.current !== name || !svgElementRef.current) return;

    syncSvgElement(svgElementRef.current, latestPropsRef.current, iconClassName, uniqueId);
  }, [iconAppearanceKey, iconClassName, name, uniqueId]);

  return (
    <div style={wrapperStyle}>
      {isSvgLoading ? <div style={LOADING_STYLE} /> : null}
      <div ref={containerRef} style={iconStyle} />
    </div>
  );
}

export default memo(GenIcon, areResolvedIconPropsEqual);

function useRequiredSvgCacheStore() {
  const store = useSvgCacheStoreContext();
  if (!store) throw new Error("SVG Cache Store is not provided!");
  return store;
}
