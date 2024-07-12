<script setup lang="ts">
import GenIcon from "./GenIcon.vue";

const BASE_PATH = "./src/assets/";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  width: {
    type: String,
  },
  height: {
    type: String,
  },
  color: {
    type: Array,
  },
});
</script>

<template>
  <div>
    <GenIcon
      v-if="props.name"
      :src="`${BASE_PATH}${props.name}.svg`"
      :width="props.width"
      :height="props.height"
      :color="props.color"
    />
  </div>
</template>
