<script setup lang="ts">
import { nextTick, ref, watch, inject } from "vue";
import { Icon, drawCanvasIcon, CreateCacheStore, clearCanvasIconCache } from "@v-simple/icon";

const showIconOne = ref(true);
const showIconTwo = ref(true);
const showCanvasOne = ref(true);
const showCanvasTwo = ref(true);

const canvasOneRef = ref<HTMLCanvasElement | null>(null);
const canvasTwoRef = ref<HTMLCanvasElement | null>(null);

const svgStore = inject<CreateCacheStore>("svgCacheStore:v1")!;

const isRed = ref(true);

/**
 * CSS 변수 읽기
 */
function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

async function renderCanvas() {
  const color = getCssVar("--icon-color");

  console.log("Rendering canvas with color:", color);

  if (showCanvasOne.value && canvasOneRef.value) {
    const ctx = canvasOneRef.value.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);

      await drawCanvasIcon(
        ctx,
        {
          name: "sample",
          stroke: color,
          size: 50,
          x: 7,
          y: 7,
        },
        svgStore
      );
    }
  }

  if (showCanvasTwo.value && canvasTwoRef.value) {
    const ctx = canvasTwoRef.value.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);

      await drawCanvasIcon(
        ctx,
        {
          name: "sample",
          stroke: color,
          size: 50,
          x: 7,
          y: 7,
        },
        svgStore
      );
    }
  }
}

/**
 * CSS 변수 변경 테스트
 */
async function toggleColor() {
  isRed.value = !isRed.value;

  document.documentElement.style.setProperty("--icon-color", isRed.value ? "red" : "blue");

  // sprite cache 초기화
  clearCanvasIconCache();

  await nextTick();
  await renderCanvas();
}

watch(
  [showCanvasOne, showCanvasTwo],
  async () => {
    await nextTick();
    await renderCanvas();
  },
  { immediate: true, flush: "post" }
);
</script>

<template>
  <div class="container">
    <h2>Component 방식</h2>

    <button @click="showIconOne = !showIconOne">아이콘 토글 1</button>
    <button @click="showIconTwo = !showIconTwo">아이콘 토글 2</button>

    <Icon v-if="showIconOne" name="sample" width="50" height="50" color="red" />
    <Icon v-if="showIconTwo" name="sample" width="50" height="50" color="blue" />

    <hr />

    <h2>Canvas 방식</h2>

    <button @click="showCanvasOne = !showCanvasOne">캔버스 토글 1</button>
    <button @click="showCanvasTwo = !showCanvasTwo">캔버스 토글 2</button>

    <!-- CSS 변수 변경 테스트 -->
    <button @click="toggleColor">CSS 변수 색상 변경</button>

    <canvas v-if="showCanvasOne" ref="canvasOneRef" width="64" height="64" />
    <canvas v-if="showCanvasTwo" ref="canvasTwoRef" width="64" height="64" />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
</style>
