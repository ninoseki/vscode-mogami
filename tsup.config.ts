import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"],
  shims: false,
  dts: false,
  external: ["vscode"],
  noExternal: [
    "@iarna/toml",
    "@renovate/pep440",
    "@renovate/ruby-semver",
    "axios-cache-interceptor",
    "axios",
    "camelcase-keys",
    "fp-ts",
    "neverthrow",
    "p-limit",
    "semver",
    "snyk-poetry-lockfile-parser",
    "unquote",
    "zod",
  ],
});
