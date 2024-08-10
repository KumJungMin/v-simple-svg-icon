<template>
  <div ref="svgContainer" :class="iconClasses" :style="iconStyle"></div>
</template>

<script setup lang="ts">
import type { SvgCacheStore } from "@/composables/useSvgCacheStore";
import { ref, onMounted, onUnmounted, inject, watch, computed } from "vue";

const props = defineProps<{
  name?: string;
  src: string;
  width?: string;
  height?: string;
  color?: string;
  hoverColor?: string;
  strokeWidth?: string;
}>();

const svgCacheStore = inject<SvgCacheStore>("svgCacheStore");

const iconClasses = computed(() => ({
  "gen-icon": true,
  "gen-icon--hoverable": !!props.hoverColor,
}));

const iconStyle = computed(() => ({
  cursor: "pointer",
  display: "inline-block",
  color: props.color,
}));

if (!svgCacheStore) {
  throw new Error("SVG Cache Store is not provided!");
}

const svgContainer = ref<HTMLElement | null>(null);
let svgElement: SVGElement | null = null;

const loadAndInsertSvg = async () => {
  const svgContent = await svgCacheStore.loadSvg(props.src);
  insertSvgIntoDom(svgContent);
};

const insertSvgIntoDom = (svgText: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  svgElement = doc.querySelector("svg");

  if (svgElement) {
    updateSvgAttributes();
    if (svgContainer.value) {
      svgContainer.value.innerHTML = ""; // 기존 SVG 제거
      svgContainer.value.appendChild(svgElement); // 새로운 SVG 삽입
    }
  }
};

const updateSvgAttributes = () => {
  if (svgElement) {
    const iconName = props.name || props.src.replace(/\.svg$/, "");
    const iconClassName = `i-${iconName}`;

    svgElement.setAttribute("width", props.width || "24");
    svgElement.setAttribute("height", props.height || "24");
    svgElement.style.display = "block";
    svgElement.classList.add(iconClassName);

    const paths = svgElement.querySelectorAll("[stroke], [fill]");
    addSvgPathClass(paths);
    setSvgStyle(svgElement, iconClassName);
  }
};

const addSvgPathClass = (paths: NodeListOf<Element> | Element[]) => {
  paths.forEach((path) => {
    const hasStroke =
      path.hasAttribute("stroke") && path.getAttribute("stroke") !== "none";
    const hasFill =
      path.hasAttribute("fill") && path.getAttribute("fill") !== "none";

    if (hasStroke) {
      path.classList.add("svg-stroke");
      if (props.strokeWidth) {
        path.setAttribute("stroke-width", props.strokeWidth);
      }
    }
    if (hasFill) {
      path.classList.add("svg-fill");
    }
  });
};
const setSvgStyle = (svgElement: SVGElement, iconClassName: string) => {
  let styleElement = svgElement.querySelector("style");
  if (!styleElement) {
    styleElement = document.createElement("style");
    svgElement.insertBefore(styleElement, svgElement.firstChild);
  }
  styleElement.textContent = `
      svg.${iconClassName} .svg-stroke { stroke: currentColor; }
      svg.${iconClassName} .svg-fill { fill: currentColor; }
      svg.${iconClassName}:hover .svg-stroke { stroke: ${props.hoverColor}; }
      svg.${iconClassName}:hover .svg-fill { fill: ${props.hoverColor}; }
    `;
};

onMounted(() => {
  loadAndInsertSvg();
});

onUnmounted(() => {
  svgCacheStore.removeSvg(props.src);
});

watch(
  () => [props.width, props.height, props.strokeWidth],
  () => updateSvgAttributes(),
  { immediate: true, flush: "post" }
);
</script>
