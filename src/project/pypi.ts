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

export function parse(line: string, regex: RegExp): DependencyType | undefined {
  const matches = regex.exec(line);
  if (!matches) {
    return undefined;
  }
  // FIXME: dirty hack to avoid "duplicate capture group name" error, should be removed in ES2025
  const name = matches.groups?.name || matches.groups?.name2;
  if (!name) {
    return undefined;
  }

  // FIXME: dirty hack to avoid "duplicate capture group name" error, should be removed in ES2025
  const rest = matches.groups?.rest || matches.groups?.rest2;
  // rejects something like "pydantic.mypy"
  // TODO: is there a better way to handle this?

  if ((rest || "").startsWith(".")) {
    return undefined;
  }

  const specifier = ((): string | undefined => {
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

export function createRegex(
  dependencies: string[],
  format: ProjectFormatType,
): RegExp {
  const sorted = dependencies.sort().reverse();

  const poetryPixiRegex = new RegExp(
    "^(?<name>" + sorted.join("|") + `)\\W(?<rest>.+)?$`,
  );
  const uvPyProjectRegex = new RegExp(
    "[\"'](?<name>" + sorted.join("|") + ")(?<rest>.+)?[\"']",
  );

  switch (format) {
    case "poetry":
      // FIXME: dirty hack to avoid "duplicate capture group name" error, should be removed in ES2025
      return new RegExp(
        `(${poetryPixiRegex.source})|(${uvPyProjectRegex.source.replace("<name>", "<name2>").replace("<rest>", "<rest2>")})`,
      );
    case "pixi":
      return poetryPixiRegex;
    case "uv":
    case "pyproject":
      return uvPyProjectRegex;
    default:
      return new RegExp("^(?<name>" + sorted.join("|") + `)(?<rest>.+)?$`);
  }
}
