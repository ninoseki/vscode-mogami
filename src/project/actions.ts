import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";

export const regex = /uses:\s?(?<name>[\w\-\\/]+)@(?<specifier>.+)/;

export function parseLineAsDependency(
  line: string,
): DependencyType | undefined {
  const matches = regex.exec(line);

  if (!matches) {
    return undefined;
  }

  const name = matches.groups?.name;
  const specifier = matches.groups?.specifier;
  if (!name) {
    return undefined;
  }

  return { name, specifier: specifier?.trim(), type: "ProjectName" };
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
    format: "github-actions-workflow",
  };
}
