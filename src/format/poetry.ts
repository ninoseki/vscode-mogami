import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import { getDependenciesFrom } from "snyk-poetry-lockfile-parser/dist/manifest-parser";
import unquote from "unquote";

import type { DependencyPosType } from "@/schemas";

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
      O.map((s: string) => {
        const index = s.indexOf("=");
        return s.substring(index + 1).trim();
      }),
      O.map((s: string) => unquote(s)),
      O.getOrElseW(() => undefined),
    );
  })();

  return { name, specifier, pos: matches.index };
}
