<template>
  <div v-if="props.name">
    <GenIcon2
      v-if="Array.isArray(props.color)"
      :name="props.name"
      :src="`${BASE_PATH}${props.name}.svg`"
      :width="props.width"
      :height="props.height"
      :color="props.color"
      :hover-color="props.hoverColor"
      :stroke-width="props.strokeWidth"
    />
    <GenIcon
      v-else
      :name="props.name"
      :src="`${BASE_PATH}${props.name}.svg`"
      :width="props.width"
      :height="props.height"
      :color="props.color"
      :hover-color="props.hoverColor"
      :stroke-width="props.strokeWidth"
    />
  </div>
</template>

<script setup lang="ts">
import GenIcon from "./GenIcon.vue";
import GenIcon2 from "./GenIcon2.vue";

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
    type: [String, Array], // [stroke, fill]
  },
  hoverColor: {
    type: [String, Array], // [stroke, fill]
  },
  strokeWidth: {
    type: String,
  },
});
</script>
