import { VERSION_PATTERN } from "@renovatebot/pep440/lib/version";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import { getDependenciesFrom } from "snyk-poetry-lockfile-parser/dist/manifest-parser";

import type { DependencyPosType } from "@/schemas";

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
const specifierRegExp = new RegExp(specifierPattern);
const versionRegExp = new RegExp(VERSION_PATTERN);

export function buildDepsRegExp(text: string) {
  const names = getDependenciesFrom(text, true).map((d) => d.name);
  return new RegExp(
    "^(?<name>" + names.reverse().join("|") + `)\\W(?<rest>.+)?$`,
  );
}

export function parse(
  line: string,
  depsRegExp: RegExp,
): DependencyPosType | undefined {
  const matches = depsRegExp.exec(line);
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
        const matches = specifierRegExp.exec(s) || versionRegExp.exec(s);
        if (matches) {
          return O.some(matches[0]);
        }
        return O.none;
      }),
      O.getOrElseW(() => undefined),
    );
  })();

  return { name, specifier, pos: matches.index };
}
