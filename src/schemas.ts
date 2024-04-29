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
});

export type PypiPackageType = z.infer<typeof PypiPackageSchema>;

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

export const PackageSchema = z.object({
  name: z.string(),
  version: z.string(),
  summary: z.string(),
  url: z.string().optional(),
});

export type PackageType = z.infer<typeof PackageSchema>;

export const DependencySchema = z.object({
  name: z.string(),
  specifier: z.string().optional(),
});

export type DependencyType = z.infer<typeof DependencySchema>;

export const DependencyPosSchema = DependencySchema.extend({
  pos: z.number(),
});

export type DependencyPosType = z.infer<typeof DependencyPosSchema>;

export const DependencyPosLineSchema = DependencyPosSchema.extend({
  line: z.number(),
});

export type DependencyPosLineType = z.infer<typeof DependencyPosLineSchema>;

export interface CodeLensType {
  codeLens: vscode.CodeLens;
  documentUrl: vscode.Uri;
  pkg: PackageType;
  deps: DependencyType;
}
