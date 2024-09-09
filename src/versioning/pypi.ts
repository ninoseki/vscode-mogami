import { satisfies as pep440Satisfies } from "@renovatebot/pep440";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import semver from "semver";

export function satisfies(version: string, specifier?: string): boolean {
  if (!specifier) {
    return false;
  }

  const coercedVersion = pipe(
    O.fromNullable(semver.coerce(version)),
    O.map((v) => v.toString()),
    O.getOrElse(() => version),
  );

  return (
    pep440Satisfies(coercedVersion, specifier) ||
    semver.satisfies(coercedVersion, specifier)
  );
}
