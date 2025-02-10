import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"],
  shims: false,
  dts: false,
  clean: true,
  external: ["vscode"],
  noExternal: [
    "@renovatebot/pep440",
    "@renovatebot/ruby-semver",
    "axios-cache-interceptor",
    "axios",
    "camelcase-keys",
    "compare-versions",
    "fp-ts",
    "linkedom",
    "lru-cache",
    "p-map",
    "radash",
    "semver",
    "toml-eslint-parser",
    "url-join",
    "winston-transport-vscode",
    "zod",
  ],
});
