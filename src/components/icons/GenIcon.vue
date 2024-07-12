<template>
  <div v-html="sanitizedSvgContent"></div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import DOMPurify from "dompurify";

// Props 정의
interface Props {
  src: string;
  width?: string;
  height?: string;
  color?: string[];
}

const props = defineProps<Props>();

// 기본값 설정
const width = ref(props.width || "24");
const height = ref(props.height || "24");
const color = ref(props.color || ["black", "none"]);

// Reactive 변수 설정
const svgContent = ref("");
const sanitizedSvgContent = ref("");
const svgCache: Record<string, string> = {};
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const loadSvg = async () => {
  if (svgCache[props.src]) {
    svgContent.value = svgCache[props.src];
    modifySvg();
  } else {
    try {
      const response = await fetch(props.src);
      let svgText = await response.text();

      svgCache[props.src] = svgText; // 캐시에 저장
      svgContent.value = svgText;
      modifySvg();
    } catch (error) {
      console.error("Error loading SVG:", error);
    }
  }
};

const modifySvg = () => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent.value, "image/svg+xml");
  const svg = doc.querySelector("svg");

  if (svg) {
    svg.setAttribute("width", width.value);
    svg.setAttribute("height", height.value);

    const paths = svg.querySelectorAll("[stroke], [fill]");

    paths.forEach((path) => {
      if (path.hasAttribute("stroke")) {
        path.setAttribute("stroke", color.value[0]);
        path.classList.add("svg-stroke");
      }
      if (path.hasAttribute("fill")) {
        path.setAttribute("fill", color.value[1]);
        path.classList.add("svg-fill");
      }
    });

    svgContent.value = new XMLSerializer().serializeToString(svg);
    sanitizedSvgContent.value = DOMPurify.sanitize(svgContent.value);
  }
};

const debouncedLoadSvg = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(loadSvg, 300); // 300ms 디바운스
};

// Watch props.src and reload SVG
watchEffect(() => {
  debouncedLoadSvg();
});
</script>
