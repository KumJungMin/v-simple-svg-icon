import { ref, computed, ComputedRef } from "vue";

// SvgCacheStore 인터페이스 정의
export interface SvgCacheStore {
  loadSvg: (src: string) => Promise<string>;
  removeSvg: (src: string) => void;
  getSvgUsageCount: (src: string) => number;
  clearCache: () => void;
  iconUsageCount: ComputedRef<Map<string, number>>;
  svgCache: ComputedRef<Map<string, string>>;
}

// 캐시스토어와 카운팅을 관리하는 컴포저블
export function useSvgCacheStore(): SvgCacheStore {
  const svgCache = ref<Map<string, string>>(new Map());
  const iconUsageCount = ref<Map<string, number>>(new Map());
  const pendingLoads = ref<Map<string, { promise: Promise<string>; count: number }>>(new Map());
  const maxCacheSize = 100;

  // 가장 적게 사용된 SVG를 캐시에서 제거하는 함수
  const removeLeastUsedSvg = () => {
    for (const [key, count] of iconUsageCount.value) {
      // 가장 오래된 항목 중에서 사용 횟수가 최소인 SVG를 제거하고 반복문 중단
      if (count >= 1) {
        removeSvg(key);
        break;
      }
    }
  };

  // SVG 로드를 시작하는 함수
  const loadSvg = (src: string): Promise<string> => {
    const cachedSvg = svgCache.value.get(src);
    if (cachedSvg) {
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
    if (svgCache.value.size >= maxCacheSize) removeLeastUsedSvg();

    // 요청 수 초기화
    let count = 1;

    // SVG를 로드하고 pendingLoads에 등록
    const loadPromise = (async () => {
      try {
        const response = await fetch(src);
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

  // SVG 제거하는 함수
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
    iconUsageCount: computed(() => iconUsageCount.value),
    svgCache: computed(() => svgCache.value),
  };
}
