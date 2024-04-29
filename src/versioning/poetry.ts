import { satisfies as pep440Satisfies } from "@renovatebot/pep440";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import { fromThrowable } from "neverthrow";
import semver from "semver";

export function satisfies(version: string, specifier?: string): boolean {
  if (!specifier) {
    return false;
  }

  const pep440 = pep440Satisfies(version, specifier);
  const safeSatisfies = fromThrowable(semver.satisfies);
  return (
    pep440 ||
    pipe(
      O.fromNullable(specifier),
      O.map((s: string) => safeSatisfies(version, s).unwrapOr(false)),
      O.getOrElseW(() => false),
    )
  );
}
