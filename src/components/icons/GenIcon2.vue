<template>
    <div
      ref="svgContainer"
      :style="{ cursor: 'pointer', display: 'inline-block' }"
    ></div>
  </template>
  
  <script setup lang="ts">
  import type { SvgCacheStore } from "@/composables/useSvgCacheStore";
  import { ref, onMounted, onUnmounted, inject, watch, computed } from "vue";
  
  const props = defineProps<{
    name?: string;
    src: string;
    width?: string;
    height?: string;
    color?: string[] | string;
    hoverColor?: string[] | string;
    strokeWidth?: string;
  }>();
  
  const svgCacheStore = inject<SvgCacheStore>("svgCacheStore");
  
  if (!svgCacheStore) {
    throw new Error("SVG Cache Store is not provided!");
  }
  
  const svgContainer = ref<HTMLElement | null>(null);
  let svgElement: SVGElement | null = null;
  
  const strokeColor = computed(() =>
    Array.isArray(props.color) ? props.color[0] : props.color || "currentColor"
  );
  
  const fillColor = computed(() =>
    Array.isArray(props.color) ? props.color[1] : props.color || "currentColor"
  );
  
  const hoverStrokeColor = computed(() =>
    Array.isArray(props.hoverColor)
      ? props.hoverColor[0]
      : props.hoverColor || strokeColor.value
  );
  
  const hoverFillColor = computed(() =>
    Array.isArray(props.hoverColor)
      ? props.hoverColor[1]
      : props.hoverColor || fillColor.value
  );
  
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
  
      paths.forEach((path) => {
        if (
          path.hasAttribute("stroke") &&
          path.getAttribute("stroke") !== "none"
        ) {
          path.classList.add("svg-stroke");
          if (props.strokeWidth) {
            path.setAttribute("stroke-width", props.strokeWidth);
          }
        }
        if (path.hasAttribute("fill") && path.getAttribute("fill") !== "none") {
          path.classList.add("svg-fill");
        }
      });
  
      let styleElement = svgElement.querySelector("style");
      if (!styleElement) {
        styleElement = document.createElement("style");
        svgElement.insertBefore(styleElement, svgElement.firstChild);
      }
  
      styleElement.textContent = `
        svg.${iconClassName} .svg-stroke { stroke: ${strokeColor.value}; }
        svg.${iconClassName} .svg-fill { fill: ${fillColor.value}; }
        svg.${iconClassName}:hover .svg-stroke { stroke: ${hoverStrokeColor.value}; }
        svg.${iconClassName}:hover .svg-fill { fill: ${hoverFillColor.value}; }
      `;
    }
  };
  
  onMounted(() => {
    loadAndInsertSvg();
  });
  
  onUnmounted(() => {
    svgCacheStore.removeSvg(props.src);
  });
  
  watch(
    () => [props.width, props.height, props.color, props.strokeWidth],
    () => {
      updateSvgAttributes();
    },
    { immediate: true, flush: "post" }
  );
  </script>
  