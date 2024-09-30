import { ref, computed, ComputedRef, onMounted, onUnmounted } from "vue";

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
  const maxCacheSize = 100;

  // 가장 적게 사용된 SVG를 캐시에서 제거하는 함수
  const removeLeastUsedSvg = () => {
    for (const [key, count] of iconUsageCount.value) {
        // 가장 오래된 항목 중에서 사용 횟수가 최소인 SVG를 제거하고 반복문 중단
        // 어차피 최소값은 1이고, 가장 오래된 항목을 제거해야 하므로 반복문 돌리면 됨
      if (count >= 1) {
        removeSvg(key);
        break;
      }
    }
  };

  // SVG를 로드하는 함수 (캐시에서 로드하거나 fetch)
  const loadSvg = async (src: string): Promise<string> => {
    if (svgCache.value.size >= maxCacheSize) removeLeastUsedSvg();
    if (svgCache.value.has(src)) {
      const count = getSvgUsageCount(src) + 1
      iconUsageCount.value.set(src, count);
      return svgCache.value.get(src)!;
    } else {
      try {
        const response = await fetch(src);
        const svgText = await response.text();
        svgCache.value.set(src, svgText);
        iconUsageCount.value.set(src, 1);
        return svgText;
      } catch (error) {
        console.error("Error loading SVG:", error);
        throw error;
      }
    }
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
