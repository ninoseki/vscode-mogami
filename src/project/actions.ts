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

  const normalizeSpecifier = (specifier?: string) => {
    if (!specifier) {
      return undefined;
    }
    const withoutComment = specifier.split("#")[0];
    return withoutComment.trim();
  };
  const normalizedSpecifier = normalizeSpecifier(specifier);

  return { name, specifier: normalizedSpecifier, type: "ProjectName" };
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
