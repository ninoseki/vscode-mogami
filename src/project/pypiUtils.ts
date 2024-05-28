// TODO: merge pypiUtils.ts & pypi.ts after understanding how to mock vscode with Jest
import { VERSION_PATTERN } from "@renovatebot/pep440/lib/version";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";

import { DependencyType, ProjectFormatType } from "@/schemas";

const RANGE_PATTERN = [
  "(?<operator>(===|~=|==|!=|<=|>=|<|>|\\^))",
  "\\s*",
  "(",
  /*  */ "(?<version>(?:" + VERSION_PATTERN.replace(/\?<\w+>/g, "?:") + "))",
  /*  */ "(?<prefix>\\.\\*)?",
  /*  */ "|",
  /*  */ "(?<legacy>[^,;\\s)]+)",
  ")",
].join("");

const specifierPartPattern = `\\s*${RANGE_PATTERN.replace(
  RegExp(/\?<\w+>/g),
  "?:",
)}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
export const specifierRegex = new RegExp(specifierPattern);
export const versionRegex = new RegExp(VERSION_PATTERN);

export function buildRegex(
  dependencies: string[],
  format: ProjectFormatType,
): RegExp {
  const sorted = dependencies.sort().reverse();
  switch (format) {
    case "poetry":
      return new RegExp("^(?<name>" + sorted.join("|") + `)\\W(?<rest>.+)?$`);
    case "pyproject":
      return new RegExp("(?<name>" + sorted.join("|") + `)(?<rest>.+)?`);
    default:
      return new RegExp("^(?<name>" + sorted.join("|") + `)(?<rest>.+)?$`);
  }
}

export function parse(line: string, regex: RegExp): DependencyType | undefined {
  const matches = regex.exec(line);
  if (!matches) {
    return undefined;
  }
  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }

  const specifier = (() => {
    return pipe(
      O.fromNullable(matches.groups?.rest),
      O.flatMap((s: string) => {
        const matches = specifierRegex.exec(s) || versionRegex.exec(s);
        if (matches) {
          return O.some(matches[0].trim());
        }
        return O.none;
      }),
      O.getOrElseW(() => undefined),
    );
  })();

  return { name, specifier };
}
