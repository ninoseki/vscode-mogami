import * as fs from "node:fs";

import { defineConfig } from "tsdown";
import type { PackageJson } from "type-fest";

const packageJson: PackageJson = JSON.parse(
  fs.readFileSync("package.json", "utf-8")
);

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"],
  shims: false,
  dts: false,
  clean: true,
  external: ["vscode"],
  noExternal: Object.keys(packageJson.dependencies || {}),
});
