import { satisfies as pep440Satisfies } from "@renovatebot/pep440";
import { parse } from "@renovatebot/pep440/lib/specifier";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import semver from "semver";

import { DependencyType } from "@/schemas";

export function satisfies(
  version: string,
  dependency: DependencyType,
): boolean {
  const { specifier } = dependency;
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

const isStrictEqualityOperator = (op: string) => ["==", "==="].includes(op);

export function validateRange(dependency: DependencyType): boolean {
  const { specifier } = dependency;
  if (!specifier) {
    return false;
  }

  const constraints = parse(specifier);
  if (constraints === null) {
    return false;
  }

  return constraints.every(
    (constraint) => !isStrictEqualityOperator(constraint.operator),
  );
}
