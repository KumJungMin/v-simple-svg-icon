/** @type {import('vetur').VeturConfig} */
module.exports = {
  projects: [
    {
      root: "./app",
      tsconfig: "./app/tsconfig.json",
      package: "./app/package.json",
      snippetFolder: "./.vscode/vetur/snippets",
    },
  ],
};
