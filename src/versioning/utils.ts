import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";

// Forked from https://gitlab.com/versionlens/vscode-versionlens/
export const extractSymbolFromVersionRegex = /^([^0-9]*)?.*$/;

export const semverLeadingChars = ["^", "~", "<", "<=", ">", ">=", "~>", "=="];

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
