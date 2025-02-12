import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";

import { parseLineAsDependencyByRegExp } from "./gemfile";

export const regex =
  /\b\w+\.(add_development_dependency|add_runtime_dependency|add_dependency)\s+("|')(?<name>([\w-]+))(("|'),\s("|')(?<specifier>(.+))("|'))?/;

export function parseLineAsDependency(
  line: string,
): DependencyType | undefined {
  return parseLineAsDependencyByRegExp(line, regex);
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const dependencies: [DependencyType, RawRangeType][] = [];

  for (let line = 0; line < document.lineCount; line++) {
    const { text, range } = document.lineAt(line);

    const dependency = parseLineAsDependency(text);
    if (!dependency) {
      continue;
    }

    dependencies.push([
      dependency,
      [
        range.start.line,
        range.start.character,
        range.end.line,
        range.end.character,
      ],
    ]);
  }

  return {
    dependencies,
    format: "gemspec",
  };
}
