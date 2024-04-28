import { RANGE_PATTERN } from "@renovatebot/pep440";

import type { DependencyPosType } from "@/schemas";

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

export function parse(line: string): DependencyPosType | undefined {
  const [_line] = line.split("#").map((part) => part.trim());
  const [lineNoEnvMarkers] = _line.split(";").map((part) => part.trim());
  const lineNoHashes = lineNoEnvMarkers.split(" \\")[0];
  const matches = pkgValRegExp.exec(lineNoHashes);
  if (!matches) {
    return undefined;
  }
  const [, name, , specifier] = matches;
  return { name, specifier: specifier.trim(), pos: matches.index };
}
