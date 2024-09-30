<script setup lang="ts">
import { provide, ref } from 'vue';
import Icon from "./components/icons";
import { useSvgCacheStore } from "./composables/useSvgCacheStore"; // 캐시 스토어 컴포저블 경로

// 캐시 스토어를 생성
const svgCacheStore = useSvgCacheStore();
const showIconOne = ref(true);
const showIconTwo = ref(true);

// 캐시 스토어를 전역적으로 제공
provide("svgCacheStore", svgCacheStore);
</script>

<template>
  <div>
    <button @click="showIconOne = !showIconOne">아이콘 토글1</button>
    <button @click="showIconTwo = !showIconTwo">아이콘 토글2</button>
    <Icon v-if="showIconOne" name="sample" width="50" height="50" color="red" hover-color="pink" />
    <Icon v-if="showIconTwo" name="sample" width="50" height="50" color="blue" hover-color="gray" />
    <Icon name="sample2" width="150" height="250" :color="['orange', 'red']" :hover-color="['blue', 'black']" />
    <Icon name="sample2" width="150" height="250" :color="['pink', 'white']" :hover-color="['gray', 'gray']" />
    
    {{svgCacheStore.iconUsageCount}}

</div>
</template>
