import { parse } from "@renovatebot/pep440/lib/version";
import { compareVersions, validate } from "compare-versions";
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

export function preCoerce(version: string) {
  // convert non-standard pre-release to semver pre-release
  // e.g. 7.2.0.beta2 -> 7.2.0-beta.2
  const parsed = parse(version);
  if (!parsed?.release) {
    return version;
  }

  const release = parsed!.release.join(".");
  const pre = (parsed?.pre || [])
    .map((x) => {
      if (x === "a") {
        return "alpha";
      }
      if (x === "b") {
        return "beta";
      }
      return x;
    })
    .join(".");

  if (pre === "") {
    return release;
  }

  return [release, pre].join("-");
}

export function _coerce(version: string) {
  // force coerce version. should be only used by eq & compare
  return semver.coerce(preCoerce(version) || version, {
    includePrerelease: true,
  });
}

export function coerceUnlessValid(version: string) {
  const parsed = semver.parse(version);
  if (parsed) {
    return parsed;
  }

  return _coerce(version);
}

export function eq(v1: string, v2?: string): boolean {
  if (!v2) {
    return false;
  }

  // remove leading charts (version specifier) & use compare-version for non-semver version comparison
  // (e.g. activemodel 7.1.3.4)
  const rv1 = removeLeading(v1);
  const rv2 = removeLeading(v2);
  if (validate(rv1) && validate(rv2)) {
    return compareVersions(rv1, rv2) === 0;
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
  if (validate(v1) && validate(v2)) {
    return compareVersions(v1, v2);
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

export function satisfies(version: string, specifier?: string): boolean {
  if (!specifier) {
    return false;
  }

  const coercedVersion = pipe(
    O.fromNullable(semver.coerce(version, { includePrerelease: true })),
    O.map((v) => v.toString()),
    O.getOrElse(() => version),
  );

  return semver.satisfies(coercedVersion, specifier);
}

export function isPrerelease(v: string): boolean {
  // return null if the version is a prerelease version
  if (semver.prerelease(v, { loose: true }) !== null) {
    return true;
  }
  return !/^\d[.\d]+$/.test(v);
}
