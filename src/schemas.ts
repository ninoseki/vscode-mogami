import * as vscode from "vscode";
import { z } from "zod";

export const PypiInfoSchema = z.object({
  name: z.string(),
  summary: z.string().nullish(),
  homePage: z.string().nullish(),
  packageUrl: z.string().nullish(),
  projectUrl: z.string().nullish(),
  version: z.string(),
});

export const PypiPackageReleaseSchema = z.object({
  yanked: z.boolean(),
});

export const PypiPackageSchema = z.object({
  info: PypiInfoSchema,
  releases: z.record(z.string(), z.array(PypiPackageReleaseSchema)),
});

export type PypiPackageType = z.infer<typeof PypiPackageSchema>;

export const AnacondaPackageSchema = z.object({
  name: z.string(),
  summary: z.string().nullish(),
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

const GitHubTagObjectSchema = z.object({
  sha: z.string(),
});

export const GitHubTagSchema = z.object({
  object: GitHubTagObjectSchema,
});

export type GitHubTagType = z.infer<typeof GitHubTagSchema>;

export const GitHubReleaseSchema = z.object({
  tagName: z.string(),
});

export type GitHubReleaseType = z.infer<typeof GitHubReleaseSchema>;

export const PackageSchema = z.object({
  name: z.string(),
  version: z.string().describe("The latest version of the package"),
  alias: z.string().optional().describe("An alias of the the latest version"),
  versions: z.array(z.string()),
  summary: z.string().optional(),
  url: z.string().optional(),
});

export type PackageType = z.infer<typeof PackageSchema>;

export interface DependencyType {
  name: string;
  type?: string;
  specifier?: string;
  // Gem can have multiple requirements like:
  // "progressbar", ">= 1.9.0", "< 2.0"
  specifierRequirements?: string[];
}

export type RawRangeType = [
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
];

export interface PositionLikeType {
  line: number;
  character: number;
}

export interface RangeLikeType {
  start: PositionLikeType;
  end: PositionLikeType;
}
export interface TextDocumentLikeType {
  lineCount: number;
  lineAt(line: number): { text: string; range: RangeLikeType };
  getText(range?: RangeLikeType | RawRangeType): string;
}

export const ProjectFormatSchema = z.enum([
  "gemfile",
  "gemspec",
  "github-actions-workflow",
  "pep723",
  "pip-requirements",
  "pyproject",
  "shards",
]);

export type ProjectFormatType = z.infer<typeof ProjectFormatSchema>;

export interface ProjectType {
  format: ProjectFormatType;
  dependencies: [DependencyType, RawRangeType][];
  source?: string;
  detailedFormat?: string;
}

export interface CodeLensType {
  codeLens: vscode.CodeLens;
  documentUrl: vscode.Uri;
  pkg: PackageType;
  deps: DependencyType;
}

export type SatisfiesFnType = (
  version: string,
  dependency: DependencyType,
) => boolean;

export type validateRangeFnType = (dependency: DependencyType) => boolean;

export interface PackageClientType {
  get: (name: string) => Promise<PackageType>;
  clearCache: () => void;
}
