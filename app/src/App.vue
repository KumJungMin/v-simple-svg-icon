<script setup lang="ts">
import { provide, ref } from "vue";
import { Icon, useSvgCacheStore } from "@v-simple/icon";
// import CanvasIconSample from "./components/CanvasIconSample.vue";

const svgCacheStore = useSvgCacheStore();
// const { iconUsageCount } = svgCacheStore;

const showIconOne = ref(true);
const showIconTwo = ref(true);
const showCanvasOne = ref(true);
const showCanvasTwo = ref(true);

provide("svgCacheStore", svgCacheStore);
</script>

<template>
  <div class="container">
    <h2>Component 방식</h2>
    <button @click="showIconOne = !showIconOne">아이콘 토글 1</button>
    <button @click="showIconTwo = !showIconTwo">아이콘 토글 2</button>
    <!-- <p>sample usage: {{ iconUsageCount.get("/icons/sample.svg") || 0 }}</p> -->
    <Icon v-if="showIconOne" name="sample" width="50" height="50" color="red" />
    <Icon v-if="showIconTwo" name="sample" width="50" height="50" color="blue" />

    <hr />

    <h2>Canvas 방식</h2>
    <button @click="showCanvasOne = !showCanvasOne">캔버스 토글 1</button>
    <button @click="showCanvasTwo = !showCanvasTwo">캔버스 토글 2</button>
    <!-- <p>sample2 usage: {{ iconUsageCount.get("/icons/sample2.svg") || 0 }}</p> -->
    <!-- <CanvasIconSample
      v-if="showCanvasOne"
      :store="svgCacheStore"
      src="/icons/sample2.svg"
      :width="64"
      :height="64"
    />
    <CanvasIconSample
      v-if="showCanvasTwo"
      :store="svgCacheStore"
      src="/icons/sample2.svg"
      :width="48"
      :height="48"
    /> -->
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
