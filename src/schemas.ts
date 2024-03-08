import { z } from "zod";

export const PypiInfoSchema = z.object({
  name: z.string(),
  summary: z.string(),
  home_page: z.string().nullish(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  package_url: z.string().nullish(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  project_url: z.string().nullish(),
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  homepage_uri: z.string(),
});

export const GemDependencySchema = z.object({
  name: z.string(),
  requirements: z.union([z.string(), z.undefined(), z.null()]),
});

export type GemType = z.infer<typeof GemSchema>;
export type GemDependencyType = z.infer<typeof GemDependencySchema>;
