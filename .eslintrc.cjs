/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

const mode = process.env.NODE_ENV === "production" ? "error" : "warn";

module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "plugin:regexp/recommended",
    "prettier",
  ],
  plugins: [
    "@typescript-eslint",
    "jest",
    "neverthrow",
    "prettier",
    "regexp",
    "simple-import-sort",
  ],
  rules: {
    "no-console": mode,
    "no-debugger": mode,
    "simple-import-sort/imports": mode,
    "simple-import-sort/exports": mode,
    "neverthrow/must-use-result": mode,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: ".",
  },
};
