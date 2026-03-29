/// <reference types="vite/client" />

declare module "@v-simple/icon/common" {
  import type { DefineComponent } from "vue";

  export const HomeIcon: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export const homeMeta: {
    readonly viewBox: string;
    readonly nodes: readonly {
      readonly tag: string;
      readonly attrs: Record<string, string>;
    }[];
  };
}

declare module "@v-simple/icon/core/drawIconToCanvas" {
  export interface DrawIconOptions {
    size?: number;
    fill?: string;
    stroke?: string;
  }

  export function drawIconToCanvas(
    ctx: CanvasRenderingContext2D,
    meta: { viewBox: string; nodes: readonly { tag: string; attrs: Record<string, string> }[] },
    options?: DrawIconOptions
  ): void;
}
