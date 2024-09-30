<template>
    <div>
      <table :border="1">
        <thead>
          <tr>
            <th>키 (Key)</th>
            <th>값 (Value)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in props.obj" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
        obj: Object
  });
  </script>
  
  <style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 8px;
    text-align: left;
  }
  </style>
  