import { ref, Ref, App, provide } from "vue";

const svgRawLoaders = import.meta.glob("../assets/**/*.svg", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

export interface SvgCacheStoreOptions {
  maxCacheSize?: number;
  baseUrl: string;
}

export type SvgCacheStore = {
  init: (root?: App, options?: SvgCacheStoreOptions) => CreateCacheStore;
  clear: () => void;
  getStore: () => CreateCacheStore;
};

let globalStore: CreateCacheStore | null = null;

export const providerKey = Symbol("svgCacheStore:v1");

export function useSvgCacheStore(): SvgCacheStore {
  const init = (root?: App, options?: SvgCacheStoreOptions) => {
    if (globalStore) return globalStore;

    if (!options?.baseUrl) {
      throw new Error("baseUrl is required in SvgCacheStoreOptions");
    }

    const _options = { maxCacheSize: 50, ...options };

    globalStore = createSvgCacheStore(_options);

    // Vue provide (optional)
    if (root) {
      root.provide(providerKey, globalStore);
    } else {
      try {
        provide(providerKey, globalStore);
      } catch {
        // setup 외부에서 호출되면 무시
      }
    }

    return globalStore;
  };

  const getStore = () => {
    if (!globalStore) {
      throw new Error("SvgCacheStore not initialized. Call init() first.");
    }
    return globalStore;
  };

  const clear = () => {
    globalStore?.clearCache();
  };

  return {
    init,
    clear,
    getStore,
  };
}

export interface CreateCacheStore {
  loadSvg: (name: string) => Promise<string>;
  removeSvg: (name: string) => void;
  getSvgUsageCount: (name: string) => number;
  clearCache: () => void;
  iconUsageCount: Ref<Map<string, number>>;
  svgCache: Ref<Map<string, string>>;
}

type CreateSvgCacheStoreOptions = {
  maxCacheSize: number;
  baseUrl: string;
};

type PendingLoad = {
  promise: Promise<string>;
  count: number;
};

export function createSvgCacheStore(options: CreateSvgCacheStoreOptions): CreateCacheStore {
  const normalizePath = (value: string) =>
    value.replace(/\\/g, "/").replace(/\/+$|^\/+|\?.*$/g, "");

  const getRelativeAssetsBase = (baseUrl: string) => {
    const normalized = normalizePath(baseUrl);
    const marker = "/assets";
    const markerIndex = normalized.lastIndexOf(marker);

    if (markerIndex >= 0) {
      return normalized.slice(markerIndex + 1);
    }

    if (normalized.startsWith("assets")) {
      return normalized;
    }

    return "assets";
  };

  const resolveSvgLoader = (name: string) => {
    const relativeBase = getRelativeAssetsBase(options.baseUrl);
    const preferredKey = `../${relativeBase}/${name}.svg`;
    const preferredLoader = svgRawLoaders[preferredKey];
    if (preferredLoader) {
      return preferredLoader;
    }

    const matchedKeys = Object.keys(svgRawLoaders).filter((key) => key.endsWith(`/${name}.svg`));

    if (matchedKeys.length === 1) {
      return svgRawLoaders[matchedKeys[0]];
    }

    if (matchedKeys.length > 1) {
      throw new Error(
        `Multiple SVG files matched name "${name}". Use a more specific baseUrl. Candidates: ${matchedKeys.join(", ")}`
      );
    }

    throw new Error(`SVG not found: name="${name}", baseUrl="${options.baseUrl}"`);
  };

  const svgCache = ref<Map<string, string>>(new Map());
  const iconUsageCount = ref<Map<string, number>>(new Map());
  const pendingLoads = ref<Map<string, PendingLoad>>(new Map());

  // LRU: 가장 오래 사용되지 않은 SVG를 캐시에서 제거
  const removeLeastRecentlyUsed = () => {
    const firstKey = svgCache.value.keys().next().value;
    if (firstKey) {
      svgCache.value.delete(firstKey);
      iconUsageCount.value.delete(firstKey);
    }
  };

  // 캐시 접근 시 LRU 순서 갱신 (맨 뒤로 이동)
  const touchCache = (name: string) => {
    const cachedSvg = svgCache.value.get(name);
    if (cachedSvg) {
      svgCache.value.delete(name);
      svgCache.value.set(name, cachedSvg);
    }
  };

  // SVG 로드 (컴포넌트 mount 시 호출)
  const loadSvg = async (name: string): Promise<string> => {
    const cachedSvg = svgCache.value.get(name);
    if (cachedSvg) {
      touchCache(name); // LRU 순서 갱신
      const count = getSvgUsageCount(name) + 1;
      iconUsageCount.value.set(name, count);
      return Promise.resolve(cachedSvg);
    } else {
      const pendingLoad = pendingLoads.value.get(name);
      if (pendingLoad) {
        pendingLoad.count += 1;
        return pendingLoad.promise;
      } else {
        const result = await startLoadingSvg(name);
        return result;
      }
    }
  };

  const startLoadingSvg = async (name: string): Promise<string> => {
    const count = 1;

    const loadPromise = (async (): Promise<string> => {
      let svgText: string;
      try {
        svgText = await loadSvgIcon(name);
        if (!svgText) throw new Error(`Failed to load SVG: ${name}`);

        if (svgCache.value.size >= options.maxCacheSize) removeLeastRecentlyUsed();
        svgCache.value.set(name, svgText);

        const pendingLoad = pendingLoads.value.get(name);
        const totalCount = pendingLoad ? pendingLoad.count : count;
        iconUsageCount.value.set(name, totalCount);

        return svgText;
      } catch (error) {
        console.error("Error loading SVG:", error);
        throw error;
      } finally {
        pendingLoads.value.delete(name);
      }
    })();

    pendingLoads.value.set(name, { promise: loadPromise, count: count });
    return loadPromise;
  };

  const loadSvgIcon = async (name: string): Promise<string> => {
    try {
      const loader = resolveSvgLoader(name);
      return await loader();
    } catch (error) {
      console.error("Error loading SVG:", error);
      throw error;
    }
  };

  // SVG 제거 (컴포넌트 unmount 시 호출) - 참조 카운팅 + 즉시 제거
  const removeSvg = (name: string) => {
    const usageCount = getSvgUsageCount(name);
    const count = Math.max(usageCount - 1, 0);

    iconUsageCount.value.set(name, count);
  };

  // SVG 사용 카운트 확인 함수
  const getSvgUsageCount = (name: string) => {
    return iconUsageCount.value.get(name) || 0;
  };

  // 수동 캐시 삭제 함수
  const clearCache = () => {
    svgCache.value.clear();
    iconUsageCount.value.clear();
    pendingLoads.value.clear();
  };

  return {
    loadSvg,
    removeSvg,
    getSvgUsageCount,
    clearCache,
    iconUsageCount,
    svgCache,
  };
}
