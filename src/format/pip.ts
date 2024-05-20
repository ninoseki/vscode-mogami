// Forked from https://github.com/renovatebot/renovate
import { RANGE_PATTERN } from "@renovatebot/pep440";

import type { DependencyType } from "@/schemas";

const packagePattern = "[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]";
const extrasPattern = "(?:\\s*\\[[^\\]]+\\])?";

const rangePattern: string = RANGE_PATTERN;
const specifierPartPattern = `\\s*${rangePattern.replace(
  RegExp(/\?<\w+>/g),
  "?:",
)}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
const dependencyPattern = `(${packagePattern})(${extrasPattern})(${specifierPattern})`;

export const pkgValRegExp = RegExp(`^${dependencyPattern}$`);
const packageRegExp = /^[a-z0-9][\w.-]*[a-z0-9]$/i;

export function parse(line: string): DependencyType | undefined {
  const [_line] = line.split("#").map((part) => part.trim());
  const [lineNoEnvMarkers] = _line.split(";").map((part) => part.trim());
  const lineNoHashes = lineNoEnvMarkers.split(" \\")[0];
  const matches = pkgValRegExp.exec(lineNoHashes);

  if (!matches) {
    // line may be a dependency name only (e.g. "requests")
    if (packageRegExp.test(lineNoEnvMarkers)) {
      return { name: lineNoHashes };
    }
    return undefined;
  }

  const [, name, , specifier] = matches;
  return { name, specifier: specifier.trim() };
}
