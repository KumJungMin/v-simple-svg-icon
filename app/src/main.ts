import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { useSvgCacheStore } from "@v-simple/icon";

const app = createApp(App);

const svgStore = useSvgCacheStore();

svgStore.init(app, {
  baseUrl: "/icons",
});

app.mount("#app");
