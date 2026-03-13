<template>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup lang="ts">
import type { SvgCacheStore } from "@v-simple/icon";
import { onUnmounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    store: SvgCacheStore;
    src: string;
    width?: number;
    height?: number;
  }>(),
  {
    width: 48,
    height: 48,
  }
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let objectUrl: string | null = null;

const drawSvgToCanvas = async () => {
  const svgText = await props.store.loadSvg(props.src);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }

  objectUrl = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    canvas.width = props.width;
    canvas.height = props.height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  };

  image.src = objectUrl;
};

watch(
  () => props.src,
  async (newSrc, oldSrc) => {
    if (oldSrc && oldSrc !== newSrc) {
      props.store.removeSvg(oldSrc);
    }
    await drawSvgToCanvas();
  },
  { immediate: true }
);

onUnmounted(() => {
  props.store.removeSvg(props.src);
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
});
</script>
