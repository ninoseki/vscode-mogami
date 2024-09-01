// @ts-check
import eslint from "@eslint/js";
import neverthrow from "@ninoseki/eslint-plugin-neverthrow";
import typescriptEslintParser from "@typescript-eslint/parser";
import jest from "eslint-plugin-jest";
import regexpPlugin from "eslint-plugin-regexp";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

// eslint-disable-next-line no-undef
const mode = process.env.NODE_ENV === "production" ? "error" : "warn";

export default tseslint.config(
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    extends: [eslint.configs.recommended],
  },
  {
    files: ["**/*.ts", "**/*.cts", "**/*.mts"],
    plugins: {
      "simple-import-sort": simpleImportSort,
      neverthrow: neverthrow,
    },
    rules: {
      "simple-import-sort/imports": mode,
      "simple-import-sort/exports": mode,
      "no-console": mode,
      "no-debugger": mode,
      "neverthrow/must-use-result": "error",
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    extends: [
      eslint.configs.recommended,
      jest.configs["flat/recommended"],
      regexpPlugin.configs["flat/recommended"],
      ...tseslint.configs.recommended,
    ],
  },
  {
    files: ["**/?(*.)spec.ts"],
    rules: { "jest/prefer-expect-assertions": "off" },
  }
);