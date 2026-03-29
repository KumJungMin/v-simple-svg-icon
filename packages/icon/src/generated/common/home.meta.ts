export const homeMeta = {
  viewBox: "0 0 24 24",
  nodes: [
  {
    "tag": "path",
    "attrs": {
      "d": "M3 10L12 3L21 10V21H3V10Z",
      "stroke": "#111",
      "data-color-group": "main"
    }
  },
  {
    "tag": "path",
    "attrs": {
      "d": "M9 21V12H15V21",
      "fill": "#111",
      "data-color-group": "accent"
    }
  }
],
  groups: ["main","accent"]
} as const;

export type HomeGroupName = typeof homeMeta.groups[number];