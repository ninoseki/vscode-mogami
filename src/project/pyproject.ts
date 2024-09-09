import TOML from "@iarna/toml";
import camelcaseKeys from "camelcase-keys";

import { ProjectType, PyProjectSchema } from "@/schemas";

import { createRegex } from "./pypi";
import { parse as pipParse } from "./requirements";

export function getDependenciesFrom(text: string): string[] {
  const tomlParsed = TOML.parse(text);
  const parsed = PyProjectSchema.parse(
    camelcaseKeys(tomlParsed, { deep: true }),
  );

  const dependencies = parsed.project.dependencies || [];
  const optionalDependencies = Object.values(
    parsed.project.optionalDependencies || {},
  ).flat();

  return [dependencies, optionalDependencies]
    .flat()
    .map((dependency) => {
      const pipParsed = pipParse(dependency);
      return pipParsed?.name;
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}

export function createProject(text: string): ProjectType {
  const dependencies = getDependenciesFrom(text);
  const format = "pyproject";
  const regex = createRegex(dependencies, format);
  return { dependencies, format, regex };
}
