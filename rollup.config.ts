import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import esbuild from "rollup-plugin-esbuild";

export default defineConfig({
  input: "src/extension.ts",
  output: {
    dir: "dist",
    format: "cjs",
    entryFileNames: "[name].js",
    sourcemap: process.env.NODE_ENV === "development",
  },
  external: ["vscode"],
  plugins: [
    json(),
    nodeResolve({
      extensions: [".ts", ".js"],
      preferBuiltins: true,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: process.env.NODE_ENV === "development",
      module: "ESNext",
    }),
    commonjs(),
    esbuild({
      minify: process.env.NODE_ENV === "production",
    }),
  ],
});
