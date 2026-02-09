import { ref, Ref } from "vue";

export interface SvgCacheStore {
  loadSvg: (src: string) => Promise<string>;
  removeSvg: (src: string) => void;
  getSvgUsageCount: (src: string) => number;
  clearCache: () => void;
  iconUsageCount: Ref<Map<string, number>>;
  svgCache: Ref<Map<string, string>>;
}

export function useSvgCacheStore(): SvgCacheStore {
  const svgCache = ref<Map<string, string>>(new Map());
  const iconUsageCount = ref<Map<string, number>>(new Map());
  const pendingLoads = ref<
    Map<string, { promise: Promise<string>; count: number }>
  >(new Map());
  const maxCacheSize = 100;

  // LRU: 가장 오래 사용되지 않은 SVG를 캐시에서 제거
  const removeLeastRecentlyUsed = () => {
    const firstKey = svgCache.value.keys().next().value;
    if (firstKey) {
      svgCache.value.delete(firstKey);
      iconUsageCount.value.delete(firstKey);
    }
  };

  // 캐시 접근 시 LRU 순서 갱신 (맨 뒤로 이동)
  const touchCache = (src: string) => {
    const cachedSvg = svgCache.value.get(src);
    if (cachedSvg) {
      svgCache.value.delete(src);
      svgCache.value.set(src, cachedSvg);
    }
  };

  // SVG 로드 (컴포넌트 mount 시 호출)
  const loadSvg = (src: string): Promise<string> => {
    const cachedSvg = svgCache.value.get(src);
    if (cachedSvg) {
      touchCache(src); // LRU 순서 갱신
      const count = getSvgUsageCount(src) + 1;
      iconUsageCount.value.set(src, count);
      return Promise.resolve(cachedSvg);
    } else {
      const pendingLoad = pendingLoads.value.get(src);
      if (pendingLoad) {
        pendingLoad.count += 1;
        return pendingLoad.promise;
      }
      return startLoadingSvg(src);
    }
  };

  const startLoadingSvg = (src: string): Promise<string> => {
    if (svgCache.value.size >= maxCacheSize) removeLeastRecentlyUsed();

    let count = 1;

    // SVG를 로드하고 pendingLoads에 등록
    const loadPromise = (async () => {
      try {
        // 브라우저 캐시 - 캐시된 리소스가 있으면 사용하고, 없으면 네트워크 요청
        const response = await fetch(src, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const svgText = await response.text();

        svgCache.value.set(src, svgText);

        // 로드 완료 시 iconUsageCount 업데이트
        const pendingLoad = pendingLoads.value.get(src);
        const totalCount = pendingLoad ? pendingLoad.count : count;
        iconUsageCount.value.set(src, totalCount);

        return svgText;
      } catch (error) {
        console.error("Error loading SVG:", error);
        throw error;
      } finally {
        pendingLoads.value.delete(src);
      }
    })();

    pendingLoads.value.set(src, { promise: loadPromise, count: count });
    return loadPromise;
  };

  // SVG 제거 (컴포넌트 unmount 시 호출) - 참조 카운팅 + 즉시 제거
  const removeSvg = (src: string) => {
    const usageCount = getSvgUsageCount(src);
    if (!usageCount) return;

    if (usageCount === 1) {
      svgCache.value.delete(src);
      iconUsageCount.value.delete(src);
    } else {
      iconUsageCount.value.set(src, usageCount - 1);
    }
  };

  // SVG 사용 카운트 확인 함수
  const getSvgUsageCount = (src: string) => {
    return iconUsageCount.value.get(src) || 0;
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
