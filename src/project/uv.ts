import camelcaseKeys from "camelcase-keys";
import { parse } from "smol-toml";

import { ProjectType, UvProjectSchema, UvProjectType } from "@/schemas";

import { createRegex } from "./pypi";
import { parse as pipParse } from "./requirements";

function parseAsProject(text: string) {
  return UvProjectSchema.parse(camelcaseKeys(parse(text), { deep: true }));
}

export function getDependenciesFrom(parsed: UvProjectType): string[] {
  const dependencies = parsed.project.dependencies || [];
  const optionalDependencies = Object.values(
    parsed.project.optionalDependencies || {},
  ).flat();
  const groupsDependencies = Object.values(parsed.dependencyGroups || {})
    .flat()
    .filter((i): i is string => typeof i === "string");
  const devDependencies = parsed.tool?.uv?.devDependencies || [];

  return [
    dependencies,
    optionalDependencies,
    devDependencies,
    groupsDependencies,
  ]
    .flat()
    .map((dependency) => {
      const pipParsed = pipParse(dependency);
      return pipParsed?.name;
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}

export function createProject(text: string): ProjectType {
  const parsed = parseAsProject(text);
  const source = parsed.tool?.uv?.indexUrl || undefined;
  const dependencies = getDependenciesFrom(parsed);
  const format = "uv";
  const regex = createRegex(dependencies, format);
  return { dependencies, source, format, regex };
}
