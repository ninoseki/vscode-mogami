import TOML from "@iarna/toml";
import camelcaseKeys from "camelcase-keys";

import { Logger } from "@/logger";
import { ProjectType, PyProjectSchema } from "@/schemas";

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

export function createProject(text: string): ProjectType {
  const dependencies = getDependenciesFrom(text);

  Logger.info(
    `pyproject.toml detected: ${dependencies.length} dependencies found`,
  );
  if (dependencies.length === 0) {
    throw new Error("No dependency found in pyproject.toml manifest");
  }

  return { dependencies, format: "pyproject" };
}
