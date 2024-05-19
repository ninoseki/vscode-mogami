import TOML from "@iarna/toml";
import camelcaseKeys from "camelcase-keys";

import { PyProjectSchema } from "@/schemas";

import { parse as pipParse } from "./pip";

export function getDependenciesFrom(text: string): string[] {
  const tomlParsed = TOML.parse(text);
  const parsed = PyProjectSchema.parse(
    camelcaseKeys(tomlParsed, { deep: true }),
  );

  const dependencyNames = parsed.project.dependencies
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

export function buildDepsRegExp(text: string) {
  const names = getDependenciesFrom(text)
    // should be sorted in descending alphabetical order
    .sort()
    .reverse();
  return new RegExp("(?<name>" + names.join("|") + `)(?<rest>.+)?`);
}
