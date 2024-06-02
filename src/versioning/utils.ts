import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import semver from "semver";

import { PackageType } from "@/schemas";

// Forked from https://gitlab.com/versionlens/vscode-versionlens/
// eslint-disable-next-line regexp/no-super-linear-backtracking
export const extractSymbolFromVersionRegex = /^(\D*).*$/;

export const semverLeadingChars = [
  "^",
  "~",
  "<",
  "<=",
  ">",
  ">=",
  "~>",
  "==",
  "~=",
];

export function formatWithExistingLeading(
  existingVersion: string,
  newVersion: string,
) {
  const regExResult = extractSymbolFromVersionRegex.exec(existingVersion);
  const leading = regExResult && regExResult[1];

  const hasLeading: boolean = pipe(
    O.fromNullable(leading),
    O.map((leading: string) => semverLeadingChars.includes(leading.trim())),
    O.getOrElseW(() => false),
  );

  if (!hasLeading) {
    return newVersion;
  }

  return `${leading}${newVersion}`;
}

export function coerceUnlessValid(version: string) {
  const parsed = semver.parse(version);
  if (parsed) {
    return parsed;
  }

  return semver.coerce(version);
}

export function eq(v1: string, v2?: string): boolean {
  if (!v2) {
    return false;
  }

  const cv1 = coerceUnlessValid(v1);
  const cv2 = coerceUnlessValid(v2);

  if (!cv1 || !cv2) {
    return false;
  }

  return semver.eq(cv1, cv2);
}

export function compare(a: string, b: string) {
  const v1 = coerceUnlessValid(a);
  const v2 = coerceUnlessValid(b);
  if (!v1 || !v2) {
    return a.localeCompare(b);
  }
  return v1.compare(v2);
}

export function maxSatisfying({
  pkg,
  specifier,
  satisfies,
}: {
  pkg: PackageType;
  specifier?: string;
  satisfies: (version: string, specifier?: string) => boolean;
}): string | undefined {
  return pkg.versions
    .sort(compare)
    .reverse()
    .find((v) => satisfies(v, specifier));
}

export function prereleaseLessMap(v: string) {
  // return null if the version is a prerelease version
  if (semver.prerelease(v, { loose: true }) !== null) {
    return null;
  }
  // return null if the version has any non-digit characters
  // (to reject a version like Django's 5.1a1)
  if (!/^\d[.\d]+$/.test(v)) {
    return null;
  }
  return v;
}
