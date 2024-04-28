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

export const PypiDependencySchema = z.object({
  name: z.string(),
  requirements: z.string(),
});

export const keyValueMapSchema = z.record(z.string());

export const PoetrySchema = z.object({
  dependencies: keyValueMapSchema,
  devDependencies: keyValueMapSchema,
});

export const PoetryToolSchema = z.object({
  poetry: PoetrySchema,
});

export const PoetryProjectSchema = z.object({
  tool: PoetryToolSchema,
});

export const GemSchema = z.object({
  version: z.string(),
  info: z.string(),
  homepageUri: z.string(),
});

export const GemDependencySchema = z.object({
  name: z.string(),
  requirements: z.string().nullish(),
});

export type GemType = z.infer<typeof GemSchema>;
export type GemDependencyType = z.infer<typeof GemDependencySchema>;

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
