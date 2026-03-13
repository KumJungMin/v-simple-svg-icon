import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { useSvgCacheStore } from "@v-simple/icon";

const app = createApp(App);
useSvgCacheStore().init(app, { maxCacheSize: 10, baseUrl: "/icons" });

app.mount("#app");
