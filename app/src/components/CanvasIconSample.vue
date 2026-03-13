<template>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup lang="ts">
import type { CreateCacheStore } from "@v-simple/icon";
import { onUnmounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    store: CreateCacheStore;
    name: string;
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
  const svgText = await props.store.loadSvg(props.name);
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
  () => props.name,
  async (newName, oldName) => {
    if (oldName && oldName !== newName) {
      props.store.removeSvg(oldName);
    }
    await drawSvgToCanvas();
  },
  { immediate: true }
);

onUnmounted(() => {
  props.store.removeSvg(props.name);
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
});
</script>
