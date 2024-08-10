<script setup lang="ts">
import { provide } from 'vue';
import Icon from "./components/icons";
import { useSvgCacheStore } from "./composables/useSvgCacheStore"; // 캐시 스토어 컴포저블 경로

// 캐시 스토어를 생성
const svgCacheStore = useSvgCacheStore();

// 캐시 스토어를 전역적으로 제공
provide("svgCacheStore", svgCacheStore);
</script>

<template>
  <div>
    <!-- <img src="./assets/sample.svg" /> -->
    <Icon name="sample" width="50" height="50" color="blue" hover-color="gray" />
  </div>
</template>
