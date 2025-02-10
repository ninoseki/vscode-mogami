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

export interface DependencyType {
  name: string;
  type?: string;
  specifier?: string;
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
  getText(): string;
}

export const ProjectFormatSchema = z.enum([
  "github-actions-workflow",
  "gemfile",
  "gemspec",
  "pip-requirements",
  "pyproject",
]);

export type ProjectFormatType = z.infer<typeof ProjectFormatSchema>;

export interface ProjectType {
  format: ProjectFormatType;
  dependencies: [DependencyType, RawRangeType][];
  satisfies: SatisfiesFnType;
  source?: string;
  detailedFormat?: string;
}

export interface CodeLensType {
  codeLens: vscode.CodeLens;
  documentUrl: vscode.Uri;
  pkg: PackageType;
  deps: DependencyType;
}

export type SatisfiesFnType = (version: string, specifier?: string) => boolean;

export interface PackageClientType {
  get: (name: string) => Promise<PackageType>;
  clearCache: () => void;
}
