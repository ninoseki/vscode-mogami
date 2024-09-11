import * as vscode from "vscode";
import { z } from "zod";

export const PypiInfoSchema = z.object({
  name: z.string(),
  summary: z.string(),
  homePage: z.string().nullish(),
  packageUrl: z.string().nullish(),
  projectUrl: z.string().nullish(),
  version: z.string(),
});

export const PypiPackageSchema = z.object({
  info: PypiInfoSchema,
  releases: z.record(z.string(), z.any()),
});

export type PypiPackageType = z.infer<typeof PypiPackageSchema>;

export const AnacondaPackageSchema = z.object({
  name: z.string(),
  summary: z.string(),
  home: z.string().nullish(),
  url: z.string().nullish(),
  latestVersion: z.string(),
  versions: z.array(z.string()),
});

export type AnacondaPackageType = z.infer<typeof AnacondaPackageSchema>;

export const GemVersionSchema = z.object({
  number: z.string(),
});

export const GemVersionsSchema = z.array(GemVersionSchema);

export type GemVersionsType = z.infer<typeof GemVersionsSchema>;

export const GemSchema = z.object({
  version: z.string(),
  info: z.string(),
  homepageUri: z.string(),
});

export const GemPackageSchema = z.object({
  name: z.string(),
  requirements: z.string().nullish(),
});

export type GemType = z.infer<typeof GemSchema>;
export type GemPackageType = z.infer<typeof GemPackageSchema>;

export const GitHubReleaseSchema = z.object({
  tagName: z.string(),
});

export type GitHubReleaseType = z.infer<typeof GitHubReleaseSchema>;

export const GitHubReleasesSchema = z.array(GitHubReleaseSchema);

export type GitHubReleasesType = z.infer<typeof GitHubReleasesSchema>;

export const PackageSchema = z.object({
  name: z.string(),
  version: z.string().describe("The latest version of the package"),
  versions: z.array(z.string()),
  summary: z.string().optional(),
  url: z.string().optional(),
});

export type PackageType = z.infer<typeof PackageSchema>;

export const DependencySchema = z.object({
  name: z.string(),
  specifier: z.string().optional(),
});

export type DependencyType = z.infer<typeof DependencySchema>;

export const PositionSchema = z.object({
  line: z.number(),
  character: z.number(),
});

export type PositionType = z.infer<typeof PositionSchema>;

export const PoetryProjectPoetrySourceSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const GroupDependenciesSchema = z.object({
  dependencies: z.record(z.string(), z.unknown()).default({}),
});

export const PoetryProjectPoetrySchema = z.object({
  name: z.string(),
  version: z.string().nullish(),
  source: z.array(PoetryProjectPoetrySourceSchema).nullish(),
  dependencies: z.record(z.string(), z.unknown()).default({}),
  "dev-dependencies": z.record(z.string(), z.unknown()).default({}),
  group: z.record(z.string(), GroupDependenciesSchema).default({}),
});

export const PoetryProjectToolSchema = z.object({
  poetry: PoetryProjectPoetrySchema,
});

export const PoetryProjectSchema = z.object({
  tool: PoetryProjectToolSchema,
});

export const PyProjectProjectSchema = z.object({
  dependencies: z.array(z.string()).nullish(),
  optionalDependencies: z.record(z.string(), z.array(z.string())).nullish(),
});

export const PyProjectSchema = z.object({
  project: PyProjectProjectSchema,
});

export const PixiToolPixiSchema = z.object({
  dependencies: z.record(z.string(), z.unknown()).default({}),
  feature: z.record(z.string(), GroupDependenciesSchema).default({}),
});

export const PixiToolSchema = z.object({
  pixi: PixiToolPixiSchema,
});

export const PixiProjectSchema = z.object({
  tool: PixiToolSchema,
});

export const UvProjectToolUvSchema = z.object({
  indexUrl: z.string().nullish(),
  devDependencies: z.array(z.string()).nullish(),
});

export const UvProjectToolSchema = z.object({
  uv: UvProjectToolUvSchema,
});

export const UvProjectProjectSchema = z.object({
  dependencies: z.array(z.string()).nullish(),
  optionalDependencies: z.record(z.string(), z.array(z.string())).nullish(),
});

export const UvProjectSchema = z.object({
  project: UvProjectProjectSchema,
  tool: UvProjectToolSchema,
});

export type UvProjectType = z.infer<typeof UvProjectSchema>;

export const ProjectFormatSchema = z.enum([
  "github-actions-workflow",
  "gemfile",
  "gemspec",
  "pixi",
  "poetry",
  "pyproject",
  "pip-requirements",
  "uv",
]);

export type ProjectFormatType = z.infer<typeof ProjectFormatSchema>;

export const ProjectSchema = z.object({
  dependencies: z.array(z.string()),
  source: z.string().optional(),
  format: ProjectFormatSchema,
  regex: z.instanceof(RegExp),
});

export type ProjectType = z.infer<typeof ProjectSchema>;

export interface DependencyPositionType {
  position: vscode.Position;
  dependency: DependencyType;
}

export interface CodeLensType {
  codeLens: vscode.CodeLens;
  documentUrl: vscode.Uri;
  pkg: PackageType;
  deps: DependencyType;
}

export type ParseFnType = (line: string) => DependencyType | undefined;
export type SatisfiesFnType = (version: string, specifier?: string) => boolean;

export interface PackageClientType {
  get: (name: string) => Promise<PackageType>;
  clearCache: () => void;
}
