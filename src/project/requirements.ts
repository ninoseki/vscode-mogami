// Forked from https://github.com/renovatebot/renovate
import { RANGE_PATTERN } from "@renovatebot/pep440";

import type { DependencyType, ProjectType } from "@/schemas";

import { createRegex } from "./pypi";

const packagePattern = "[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]";
const extrasPattern = "(?:\\s*\\[[^\\]]+\\])?";

const rangePattern: string = RANGE_PATTERN;
const specifierPartPattern = `\\s*${rangePattern.replace(
  RegExp(/\?<\w+>/g),
  "?:",
)}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
const dependencyPattern = `(${packagePattern})(${extrasPattern})(${specifierPattern})`;

export const pkgValRegex = RegExp(`^${dependencyPattern}$`);
const packageRegex = /^[a-z0-9][\w.-]*[a-z0-9]$/i;

export function parse(line: string): DependencyType | undefined {
  const [_line] = line.split("#").map((part) => part.trim());
  const [lineNoEnvMarkers] = _line.split(";").map((part) => part.trim());
  const lineNoHashes = lineNoEnvMarkers.split(" \\")[0];
  const matches = pkgValRegex.exec(lineNoHashes);

  if (!matches) {
    // line may be a dependency name only (e.g. "requests")
    if (packageRegex.test(lineNoEnvMarkers)) {
      return { name: lineNoHashes };
    }
    return undefined;
  }

  const [, name, , specifier] = matches;
  return { name, specifier: specifier.trim() };
}

export function getDependenciesFrom(text: string): string[] {
  return text
    .split("\n")
    .map((line) => parse(line))
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined)
    .map((deps) => deps.name);
}

export function getIndexUrl(text: string): string | undefined {
  const parseIndexUrl = (line: string) => {
    if (line.trim().startsWith("--index-url")) {
      const splitted = line.split("--index-url");
      return splitted[splitted.length - 1].trim();
    }
  };

  return text
    .split("\n")
    .map((line) => parseIndexUrl(line))
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined)
    .find((url) => url !== undefined);
}

export function createProject(text: string): ProjectType {
  const dependencies = getDependenciesFrom(text);
  const source = getIndexUrl(text);
  const format = "pip-requirements";
  const regex = createRegex(dependencies, format);
  return { dependencies, source, format, regex };
}
