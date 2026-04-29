export { default as Icon } from "./components/icons/Icon";
export {
  useSvgCacheStore,
  SvgCacheStoreContext,
  useSvgCacheStoreContext,
} from "./composables/useSvgCacheStore";
export type { SvgCacheStore, CreateCacheStore } from "./composables/useSvgCacheStore";
export type { DrawCanvasIconOptions } from "./helpers/canvas/draw";
export { drawCanvasIcon, clearCanvasIconCache } from "./helpers/canvas/draw";
