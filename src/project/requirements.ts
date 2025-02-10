import { RANGE_PATTERN } from "@renovatebot/pep440";

import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";
import { satisfies } from "@/versioning/pypi";

// Forked from https://github.com/renovatebot/renovate
const packagePattern = "[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]";
const extrasPattern = "(?:\\s*\\[[^\\]]+\\])?";

const rangePattern: string = RANGE_PATTERN;
const specifierPartPattern = `\\s*${rangePattern.replace(
  RegExp(/\?<\w+>/g),
  "?:",
)}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
const dependencyPattern = `(${packagePattern})(${extrasPattern})(${specifierPattern})`;

export const pkgValRegex = RegExp(`^${dependencyPattern}$`);
const packageRegex = /^[a-z0-9][\w.-]*[a-z0-9]$/i;

export function parseLineAsDependency(
  line: string,
): DependencyType | undefined {
  const [_line] = line.split("#").map((part) => part.trim());
  const [lineNoEnvMarkers] = _line.split(";").map((part) => part.trim());
  const lineNoHashes = lineNoEnvMarkers.split(" \\")[0];
  const matches = pkgValRegex.exec(lineNoHashes);

  if (!matches) {
    // line may be a dependency name only (e.g. "requests")
    if (packageRegex.test(lineNoEnvMarkers)) {
      return { name: lineNoHashes, type: "ProjectName" };
    }
    return undefined;
  }

  const [, name, , specifier] = matches;
  return { name, specifier: specifier.trim(), type: "ProjectName" };
}

function parseIndexUrl(line: string): string | undefined {
  if (line.trim().startsWith("--index-url")) {
    const splitted = line.split("--index-url");
    return splitted[splitted.length - 1].trim();
  }
  return undefined;
}

// forked from https://github.com/Twixes/pypi-assistant/
export function parseProject(document: TextDocumentLikeType): ProjectType {
  let source: string | undefined = undefined;
  const dependencies: [DependencyType, RawRangeType][] = [];

  for (let line = 0; line < document.lineCount; line++) {
    const { text, range } = document.lineAt(line);

    if (!source) {
      source = parseIndexUrl(text);
    }

    const requirement = parseLineAsDependency(text);
    if (requirement?.type !== "ProjectName") {
      continue;
    }

    dependencies.push([
      requirement,
      [
        range.start.line,
        range.start.character,
        range.end.line,
        range.end.character,
      ],
    ]);
  }

  return { dependencies, source, format: "pip-requirements", satisfies };
}
