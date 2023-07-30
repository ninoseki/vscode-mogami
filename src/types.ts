export interface PypiInfo {
  name: string;
  summary: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  home_page: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  package_url: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  project_url: string;
  version: string;
}

export interface PypiPackage {
  info: PypiInfo;
}

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

export interface Gem {
  version: string;
  info: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  homepage_uri: string;
}

export interface GemDependency {
  name: string;
  requirements: string | undefined;
}
