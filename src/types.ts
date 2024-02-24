export interface PypiDependency {
  name: string;
  requirements: string;
}

export interface KeyValueMap {
  [key: string]: string;
}

export interface Poetry {
  dependencies: KeyValueMap;
  devDependencies: KeyValueMap;
}

export interface PoetryTool {
  poetry: Poetry;
}

export interface PoetryProject {
  tool: PoetryTool;
}

export interface GemDependency {
  name: string;
  requirements: string | undefined;
}
