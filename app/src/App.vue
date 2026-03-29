<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { HomeIcon, homeMeta } from "@v-simple/icon/common";
import { drawIconToCanvas } from "@v-simple/icon/core/drawIconToCanvas";

const showIconOne = ref(true);
const showIconTwo = ref(true);
const showCanvasOne = ref(true);
const showCanvasTwo = ref(true);

const canvasOneRef = ref<HTMLCanvasElement | null>(null);
const canvasTwoRef = ref<HTMLCanvasElement | null>(null);

const isRed = ref(true);

/**
 * CSS 변수 읽기
 */
function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Canvas 렌더링
 */
function renderCanvas() {
  const color = getCssVar("--icon-color");

  if (showCanvasOne.value && canvasOneRef.value) {
    const ctx = canvasOneRef.value.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);

      drawIconToCanvas(ctx, homeMeta, {
        stroke: color,
        size: 50,
      });
    }
  }

  if (showCanvasTwo.value && canvasTwoRef.value) {
    const ctx = canvasTwoRef.value.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);

      drawIconToCanvas(ctx, homeMeta, {
        stroke: color,
        size: 50,
      });
    }
  }
}

/**
 * CSS 변수 변경 테스트
 */
async function toggleColor() {
  isRed.value = !isRed.value;

  document.documentElement.style.setProperty("--icon-color", isRed.value ? "red" : "blue");

  await nextTick();
  renderCanvas();
}

watch(
  [showCanvasOne, showCanvasTwo],
  async () => {
    await nextTick();
    renderCanvas();
  },
  { immediate: true, flush: "post" }
);
</script>

<template>
  <div class="container">
    <h2>Component 방식</h2>

    <button @click="showIconOne = !showIconOne">아이콘 토글 1</button>
    <button @click="showIconTwo = !showIconTwo">아이콘 토글 2</button>

    <HomeIcon v-if="showIconOne" width="50" height="50" color="red" />
    <HomeIcon v-if="showIconTwo" width="50" height="50" color="blue" />

    <hr />

    <h2>Canvas 방식</h2>

    <button @click="showCanvasOne = !showCanvasOne">캔버스 토글 1</button>
    <button @click="showCanvasTwo = !showCanvasTwo">캔버스 토글 2</button>

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
