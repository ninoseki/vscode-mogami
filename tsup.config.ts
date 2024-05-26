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
    "fp-ts",
    "p-map",
    "semver",
    "snyk-poetry-lockfile-parser",
    "url-join",
    "zod",
  ],
});
