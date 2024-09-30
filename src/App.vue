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
    <Icon name="sample" width="50" height="50" color="red" hover-color="pink" />
    <Icon name="sample" width="50" height="50" color="blue" hover-color="gray" />
    <!-- <Icon name="sample2" width="150" height="250" color="orange" hover-color="red" />
    <Icon name="sample2" width="150" height="250" color="blue" hover-color="black" /> -->
    <Icon name="sample2" width="150" height="250" :color="['orange', 'red']" :hover-color="['blue', 'black']" />

</div>
</template>
