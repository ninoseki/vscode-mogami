import { satisfies as pep440Satisfies } from "@renovatebot/pep440";
import { parse } from "@renovatebot/pep440/lib/specifier";
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

  const coerced: string =
    semver.coerce(version, { includePrerelease: true })?.toString() || version;

  return (
    pep440Satisfies(coerced, specifier) || semver.satisfies(coerced, specifier)
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
