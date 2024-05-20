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

export function eq(v1: string, v2?: string): boolean {
  if (!v2) {
    return false;
  }

  const cv1 = semver.coerce(v1);
  const cv2 = semver.coerce(v2);

  if (!cv1 || !cv2) {
    return false;
  }

  return semver.eq(cv1, cv2);
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
    .sort((a, b) => {
      const v1 = semver.coerce(a);
      const v2 = semver.coerce(b);
      if (!v1 || !v2) {
        return b.localeCompare(a);
      }
      return v2.compare(v1);
    })
    .find((v) => satisfies(v, specifier));
}
