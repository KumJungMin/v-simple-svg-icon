import { createContext, useContext } from "react";

const svgRawLoaders = import.meta.glob("../assets/**/*.svg", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

export interface SvgCacheStoreOptions {
  maxCacheSize?: number;
  baseUrl: string;
}

export type SvgCacheStore = {
  init: (options?: SvgCacheStoreOptions) => CreateCacheStore;
  clear: () => void;
  getStore: () => CreateCacheStore;
};

let globalStore: CreateCacheStore | null = null;

export const SvgCacheStoreContext = createContext<CreateCacheStore | null>(null);

export function useSvgCacheStoreContext() {
  return useContext(SvgCacheStoreContext);
}

export function useSvgCacheStore(): SvgCacheStore {
  const init = (options?: SvgCacheStoreOptions) => {
    if (globalStore) return globalStore;
    if (!options?.baseUrl) throw new Error("baseUrl is required in SvgCacheStoreOptions");
    globalStore = createSvgCacheStore({ maxCacheSize: 50, ...options });
    return globalStore;
  };

  const getStore = () => {
    if (!globalStore) throw new Error("SvgCacheStore not initialized. Call init() first.");
    return globalStore;
  };

  return {
    init,
    clear: () => globalStore?.clearCache(),
    getStore,
  };
}

export interface CreateCacheStore {
  loadSvg: (name: string) => Promise<string>;
  removeSvg: (name: string) => void;
  getSvgUsageCount: (name: string) => number;
  clearCache: () => void;
  iconUsageCount: Map<string, number>;
  svgCache: Map<string, string>;
}

type PendingLoad = { promise: Promise<string>; count: number };

export function createSvgCacheStore(options: Required<SvgCacheStoreOptions>): CreateCacheStore {
  const normalizePath = (value: string) => value.replace(/\\/g, "/").replace(/\/+$/g, "").replace(/^\/+/, "").replace(/\?.*$/, "");

  const getRelativeAssetsBase = (baseUrl: string) => {
    const normalized = normalizePath(baseUrl);
    const markerIndex = normalized.lastIndexOf("/assets");
    if (markerIndex >= 0) return normalized.slice(markerIndex + 1);
    if (normalized.startsWith("assets")) return normalized;
    return "assets";
  };

  const resolveSvgLoader = (name: string) => {
    const relativeBase = getRelativeAssetsBase(options.baseUrl);
    const preferredKey = `../${relativeBase}/${name}.svg`;
    if (svgRawLoaders[preferredKey]) return svgRawLoaders[preferredKey];

    const matchedKeys = Object.keys(svgRawLoaders).filter((key) => key.endsWith(`/${name}.svg`));
    if (matchedKeys.length === 1) return svgRawLoaders[matchedKeys[0]];
    if (matchedKeys.length > 1) {
      throw new Error(`Multiple SVG files matched name "${name}". Use a more specific baseUrl. Candidates: ${matchedKeys.join(", ")}`);
    }
    throw new Error(`SVG not found: name="${name}", baseUrl="${options.baseUrl}"`);
  };

  const svgCache = new Map<string, string>();
  const iconUsageCount = new Map<string, number>();
  const pendingLoads = new Map<string, PendingLoad>();

  const removeLeastRecentlyUsed = () => {
    const firstKey = svgCache.keys().next().value as string | undefined;
    if (!firstKey) return;
    svgCache.delete(firstKey);
    iconUsageCount.delete(firstKey);
  };

  const touchCache = (name: string) => {
    const cached = svgCache.get(name);
    if (!cached) return;
    svgCache.delete(name);
    svgCache.set(name, cached);
  };

  const loadSvg = async (name: string) => {
    const cached = svgCache.get(name);
    if (cached) {
      touchCache(name);
      iconUsageCount.set(name, (iconUsageCount.get(name) ?? 0) + 1);
      return cached;
    }

    const pending = pendingLoads.get(name);
    if (pending) {
      pending.count += 1;
      return pending.promise;
    }

    const loadPromise = (async () => {
      try {
        const svg = await resolveSvgLoader(name)();
        if (!svg) throw new Error(`Failed to load SVG: ${name}`);
        if (svgCache.size >= options.maxCacheSize) removeLeastRecentlyUsed();
        svgCache.set(name, svg);
        iconUsageCount.set(name, pendingLoads.get(name)?.count ?? 1);
        return svg;
      } finally {
        pendingLoads.delete(name);
      }
    })();

    pendingLoads.set(name, { promise: loadPromise, count: 1 });
    return loadPromise;
  };

  return {
    loadSvg,
    removeSvg: (name: string) => iconUsageCount.set(name, Math.max((iconUsageCount.get(name) ?? 0) - 1, 0)),
    getSvgUsageCount: (name: string) => iconUsageCount.get(name) ?? 0,
    clearCache: () => {
      svgCache.clear();
      iconUsageCount.clear();
      pendingLoads.clear();
    },
    iconUsageCount,
    svgCache,
  };
}
