import { ref, computed, ComputedRef } from "vue";

export interface SvgCacheStore {
  loadSvg: (src: string) => Promise<string>;
  removeSvg: (src: string) => void;
  getSvgUsageCount: (src: string) => number;
  svgCache: ComputedRef<Record<string, string>>;
}

// 캐시스토어와 카운팅을 관리하는 컴포저블
export function useSvgCacheStore(): SvgCacheStore {
  const svgCache = ref<Record<string, string>>({});
  const iconUsageCount = ref<Record<string, number>>({});

  const loadSvg = async (src: string): Promise<string> => {
    if (svgCache.value[src]) {
      iconUsageCount.value[src] += 1;
      return svgCache.value[src];
    } else {
      try {
        const response = await fetch(src);
        const svgText = await response.text();

        svgCache.value[src] = svgText;
        iconUsageCount.value[src] = 1;
        return svgText;
      } catch (error) {
        console.error("Error loading SVG:", error);
        throw error;
      }
    }
  };

  const removeSvg = (src: string) => {
    if (iconUsageCount.value[src]) {
      iconUsageCount.value[src] -= 1;
      if (iconUsageCount.value[src] === 0) {
        delete svgCache.value[src];
        delete iconUsageCount.value[src];
      }
    }
  };

  const getSvgUsageCount = (src: string) => {
    return iconUsageCount.value[src] || 0;
  };

  return {
    loadSvg,
    removeSvg,
    getSvgUsageCount,
    svgCache: computed(() => svgCache.value),
  };
}
