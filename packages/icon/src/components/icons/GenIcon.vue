<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CreateCacheStore, providerKey } from "../../composables/useSvgCacheStore";

const props = defineProps<{
  name: string;
  width: string;
  height: string;

  color: string | string[]; // [strokeColor, fillColor] or single color
  colorGroup: { name: string; stroke: string; fill: string }[]; // 그룹별 색상 지정(만약 여러 fill/stroke가 있다면)
  isActive: boolean;
  activeColor: string | string[]; // [strokeColor, fillColor] or single color
  strokeWidth: string;
}>();

const STROKE_CLASS = "svg-stroke";
const STROKE_WIDTH_CLASS = "svg-stroke-width";
const FILL_CLASS = "svg-fill";

const iconClassName = `i-${props.name || "icon"}`;
const uniqueId = getUniqueId(iconClassName);

const svgCacheStore = inject<CreateCacheStore>(providerKey);

const isSvgLoading = ref(false);
const svgContainer = ref<HTMLDivElement | null>(null);
let svgElement: SVGElement | null = null;

const defaultStyle = computed(() => ({
  cursor: "pointer",
  display: "inline-block",
  width: `${props.width}px`,
  height: `${props.height}px`,
}));
const strokeColor = computed(() => {
  if (Array.isArray(props.color)) {
    return props.color[0];
  }
  return props.color || "currentColor";
});
const fillColor = computed(() => {
  if (Array.isArray(props.color)) {
    return props.color[1];
  }
  return props.color || "currentColor";
});
const strokeActiveColor = computed(() => {
  if (Array.isArray(props.activeColor)) {
    return props.activeColor[0];
  }
  return props.activeColor || strokeColor.value;
});
const fillActiveColor = computed(() => {
  if (Array.isArray(props.activeColor)) {
    return props.activeColor[1];
  }
  return props.activeColor || fillColor.value;
});

onCreated();
onMounted(() => {
  loadAndInsertSvg();
});
onBeforeUnmount(() => {
  svgCacheStore?.removeSvg(props.name);
});

watch(props, () => {
  if (props.name) {
    loadAndInsertSvg();
  }
});

function onCreated() {
  if (!svgCacheStore) {
    throw new Error("SVG Cache Store is not provided!");
  }
}

async function loadAndInsertSvg() {
  const svgContent = await svgCacheStore?.loadSvg(props.name);
  if (svgContent) {
    insertSvgIntoDom(svgContent);
  } else {
    isSvgLoading.value = true;
  }
}

function insertSvgIntoDom(svgText: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const parseSvg = doc.querySelector("svg");

  if (parseSvg) {
    svgElement = parseSvg;
    setSvgAttributes();
    if (svgContainer.value) {
      (svgContainer.value as HTMLDivElement).replaceChildren(svgElement);
    } else {
      isSvgLoading.value = true;
    }
  } else {
    isSvgLoading.value = true;
  }
}

function setSvgAttributes() {
  if (!svgElement) return;

  svgElement.setAttribute("width", props.width || "24");
  svgElement.setAttribute("height", props.height || "24");

  svgElement.style.display = "block";
  svgElement.classList.add(iconClassName);
  svgElement.classList.add(uniqueId);

  updateSvgAttributes();
  applyStyle({ iconClassName, uniqueId });
}

function getUniqueId(iconClassName: string) {
  return `${iconClassName}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

function updateSvgAttributes() {
  if (!svgElement) return;

  const paths: NodeListOf<SVGPathElement> = svgElement.querySelectorAll("[stroke], [fill]");

  if (!paths) return;

  for (const path of paths as unknown as SVGPathElement[]) {
    const hasStroke = path.hasAttribute("stroke") && path.getAttribute("stroke") !== "none";
    if (hasStroke && props.strokeWidth) {
      settingPathStroke(path);
    }

    const hasFill = path.hasAttribute("fill") && path.getAttribute("fill") !== "none";
    if (hasFill) {
      settingPathFill(path);
    }

    const colorGroupName = path.dataset ? path.dataset.colorGroup : null;
    if (colorGroupName && props.colorGroup) {
      settingPathGroupClass(path, colorGroupName);
    }
  }
}

function settingPathStroke(path: SVGPathElement) {
  path.classList.add(STROKE_CLASS);
  toggleActiveClass(path);
  path.setAttribute(STROKE_WIDTH_CLASS, props.strokeWidth);
}

function settingPathFill(path: SVGPathElement) {
  path.classList.add(FILL_CLASS);
  toggleActiveClass(path);
}

function settingPathGroupClass(path: SVGPathElement, groupName: string) {
  const groupClassName = getColorGroupClassName(groupName);
  path.classList.add(groupClassName);

  toggleActiveClass(path);
}

function toggleActiveClass(path: SVGPathElement) {
  if (props.isActive) {
    path.classList.add("active");
  } else {
    path.classList.remove("active");
  }
}

function applyStyle(data: { iconClassName: string; uniqueId: string }) {
  if (!svgElement) return;

  let styleElement = svgElement?.querySelector("style[data-gen-icon]");

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.setAttribute("data-gen-icon", "true");
    svgElement?.insertBefore(styleElement, svgElement.firstChild);
  }

  styleElement.textContent = getSvgStyleContent({
    iconClassName: data.iconClassName,
    uniqueId: data.uniqueId,
  });
}

function getSvgStyleContent(data: { iconClassName: string; uniqueId: string }) {
  const svgClass = `svg.${data.iconClassName}.${data.uniqueId}`;
  const contents = [
    `${svgClass} .${STROKE_CLASS} { stroke: ${strokeColor.value}; }`,
    `${svgClass} .${STROKE_CLASS}.active { stroke: ${strokeActiveColor.value}; }`,

    `${svgClass} .${FILL_CLASS} { fill: ${fillColor.value}; }`,
    `${svgClass} .${FILL_CLASS}.active { fill: ${fillActiveColor.value}; }`,
  ];
  for (const data of props.colorGroup) {
    const { name, fill = "", stroke = "" } = data;
    const groupClassName = getColorGroupClassName(name);

    if (fill) contents.push(`${svgClass} .${groupClassName} { fill: ${fill} !important; }`);
    if (stroke) contents.push(`${svgClass} .${groupClassName} { stroke: ${stroke} !important; }`);
  }

  return contents.join(" ");
}

function getColorGroupClassName(groupName: string) {
  return `color-group-${groupName}`;
}
</script>

<template>
  <div class="position-relative" :style="defaultStyle">
    <div
      v-if="isSvgLoading"
      class="skeleton-bg position-absolute"
      :style="{ ...defaultStyle, top: 0, left: 0 }"
    ></div>
    <div ref="svgContainer" class="gen-icon" :style="defaultStyle"></div>
  </div>
</template>

<style scoped>
.position-relative {
  position: relative;
}
.position-absolute {
  position: absolute;
}
.skeleton-bg {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  animation: pulse 1.5s infinite ease-in-out;
}
</style>
