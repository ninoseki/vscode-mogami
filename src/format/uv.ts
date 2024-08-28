import TOML from "@iarna/toml";
import camelcaseKeys from "camelcase-keys";

import { ProjectType, UvProjectSchema, UvProjectType } from "@/schemas";

import { parse as pipParse } from "./requirements";

function parseAsProject(text: string) {
  const tomlParsed = TOML.parse(text);
  return UvProjectSchema.parse(camelcaseKeys(tomlParsed, { deep: true }));
}

export function getDependenciesFrom(parsed: UvProjectType): string[] {
  const dependencies = parsed.project.dependencies || [];
  const optionalDependencies = Object.values(
    parsed.project.optionalDependencies || {},
  ).flat();
  const devDependencies = parsed.tool.uv.devDependencies || [];

  return [dependencies, optionalDependencies, devDependencies]
    .flat()
    .map((dependency) => {
      const pipParsed = pipParse(dependency);
      return pipParsed?.name;
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}

export function createProject(text: string): ProjectType {
  const parsed = parseAsProject(text);
  const source = parsed.tool.uv.indexUrl || undefined;
  const dependencies = getDependenciesFrom(parsed);
  return { dependencies, source, format: "uv" };
}
