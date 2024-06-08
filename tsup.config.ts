import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"],
  shims: false,
  dts: false,
  clean: true,
  external: ["vscode"],
  noExternal: [
    "@iarna/toml",
    "@renovatebot/pep440",
    "@renovatebot/ruby-semver",
    "axios-cache-interceptor",
    "axios",
    "camelcase-keys",
    "compare-versions",
    "fp-ts",
    "html-to-text",
    "p-map",
    "radash",
    "semver",
    "url-join",
    "winston-transport-vscode",
    "zod",
  ],
});
