import TOML from "@iarna/toml";
import camelcaseKeys from "camelcase-keys";

import { PyProjectSchema, PythonProjectType } from "@/schemas";

import { parse as pipParse } from "./requirements";

export function getDependenciesFrom(text: string): string[] {
  const tomlParsed = TOML.parse(text);
  const parsed = PyProjectSchema.parse(
    camelcaseKeys(tomlParsed, { deep: true }),
  );

  const dependencyNames = (parsed.project.dependencies || [])
    .map((dependency) => {
      const pipParsed = pipParse(dependency);
      return pipParsed?.name;
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);

  const optionalDependencyNames = Object.values(
    parsed.project.optionalDependencies || {},
  )
    .flat()
    .map((dependency) => {
      const pipParsed = pipParse(dependency);
      return pipParsed?.name;
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);

  return dependencyNames.concat(optionalDependencyNames);
}

export function createPythonProject(text: string): PythonProjectType {
  const dependencies = getDependenciesFrom(text);
  return { dependencies, format: "pyproject" };
}
