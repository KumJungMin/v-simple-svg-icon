<script setup lang="ts">
import GenIcon from "./GenIcon.vue";

const props = withDefaults(
  defineProps<{
    name: string;
    width?: string;
    height?: string;
    color?: string | string[]; // [strokeColor, fillColor] or single color
    colorGroup?: { name: string; stroke: string; fill: string }[]; // 그룹별 색상 지정(만약 여러 fill/stroke가 있다면)
    isActive?: boolean;
    activeColor?: string | string[]; // [strokeColor, fillColor] or single color
    strokeWidth?: string;
  }>(),
  {
    width: "24",
    height: "24",
    color: "currentColor",
    colorGroup: () => [],
    strokeWidth: "1",
    isActive: false,
    activeColor: "currentColor",
  }
);
</script>

<template>
  <GenIcon
    :name="props.name"
    :width="props.width"
    :height="props.height"
    :color="props.color"
    :is-active="props.isActive"
    :active-color="props.activeColor"
    :color-group="props.colorGroup"
    :stroke-width="props.strokeWidth"
  />
</template>
