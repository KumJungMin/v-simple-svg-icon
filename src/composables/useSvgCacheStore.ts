import { ref, computed, ComputedRef, onMounted, onUnmounted } from "vue";

// SvgCacheStore 인터페이스 정의
export interface SvgCacheStore {
  loadSvg: (src: string) => Promise<string>;
  removeSvg: (src: string) => void;
  getSvgUsageCount: (src: string) => number;
  clearCache: () => void;
  iconUsageCount: ComputedRef<Record<string, number>>;
  svgCache: ComputedRef<Record<string, string>>;
}

// 캐시스토어와 카운팅을 관리하는 컴포저블
export function useSvgCacheStore(): SvgCacheStore {
  const svgCache = ref<Record<string, string>>({});
  const iconUsageCount = ref<Record<string, number>>({});
  
  const maxCacheSize = 100;

  // 가장 적게 사용된 SVG를 캐시에서 제거하는 함수
  const removeLeastUsedSvg = () => {
    const leastUsedKey = Object.keys(iconUsageCount.value).reduce((a, b) =>
      iconUsageCount.value[a] < iconUsageCount.value[b] ? a : b
    );
    removeSvg(leastUsedKey);
  };

  // SVG를 로드하는 함수 (캐시에서 로드하거나 fetch)
  const loadSvg = async (src: string): Promise<string> => {
    // 캐시 크기 제한 확인
    if (Object.keys(svgCache.value).length >= maxCacheSize) {
      removeLeastUsedSvg();
    }

    if (svgCache.value[src]) {
      // 캐시된 항목 사용 시 카운트 증가
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

  // SVG 제거하는 함수
  const removeSvg = (src: string) => {
    if (iconUsageCount.value[src]) {
      iconUsageCount.value[src] -= 1;
      if (iconUsageCount.value[src] === 0) {
        delete svgCache.value[src];
        delete iconUsageCount.value[src];
      }
    }
  };

  // SVG 사용 카운트 확인 함수
  const getSvgUsageCount = (src: string) => {
    return iconUsageCount.value[src] || 0;
  };

  // 수동 캐시 삭제 함수
  const clearCache = () => {
    svgCache.value = {};
    iconUsageCount.value = {};
  };

  // 페이지 비활성화 감지 후 캐시 비우기
  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearCache();
      console.log("페이지가 백그라운드로 전환되어 캐시를 비웠습니다.");
    }
  };

  // 컴포넌트 마운트 시 이벤트 리스너 등록
  onMounted(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });

  // 컴포넌트 언마운트 시 이벤트 리스너 해제
  onUnmounted(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  return {
    loadSvg,
    removeSvg,
    iconUsageCount,
    getSvgUsageCount,
    clearCache,
    svgCache: computed(() => svgCache.value),
  };
}
