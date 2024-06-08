import * as compareVersions from "compare-versions";
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

const leadingCharsRegex = /^[\^~><=]+/;

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

export function removeLeading(version: string) {
  return version.trim().replace(leadingCharsRegex, "").trim();
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

  // remove leading charts (version specifier) & use compare-version for non-semver version comparison
  // (e.g. activemodel 7.1.3.4)
  const rv1 = removeLeading(v1);
  const rv2 = removeLeading(v2);
  if (compareVersions.validate(rv1) && compareVersions.validate(rv2)) {
    return compareVersions.compareVersions(rv1, rv2) === 0;
  }

  if (isPrerelease(v1) && isPrerelease(v2)) {
    return v1 == v2;
  }

  const cv1 = coerceUnlessValid(v1);
  const cv2 = coerceUnlessValid(v2);

  if (!cv1 || !cv2) {
    return false;
  }

  return semver.eq(cv1, cv2);
}

export function compare(v1: string, v2: string): number {
  // use compare-version for non-semver version comparison
  if (compareVersions.validate(v1) && compareVersions.validate(v2)) {
    return compareVersions.compareVersions(v1, v2);
  }

  if (isPrerelease(v1) && isPrerelease(v2)) {
    return v1.localeCompare(v2);
  }

  const cv1 = coerceUnlessValid(v1);
  const cv2 = coerceUnlessValid(v2);
  if (!cv1 || !cv2) {
    return v1.localeCompare(v2);
  }
  return cv1.compare(cv2);
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

export function isPrerelease(v: string): boolean {
  // return null if the version is a prerelease version
  if (semver.prerelease(v, { loose: true }) !== null) {
    return true;
  }
  return !/^\d[.\d]+$/.test(v);
}
