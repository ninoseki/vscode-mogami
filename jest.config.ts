import type { Config } from "jest";

const config: Config = {
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^vscode$": "<rootDir>/__mocks__/vscode.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.ts?$": ["ts-jest", { isolatedModules: true, useESM: true }],
  },
};

export default config;
