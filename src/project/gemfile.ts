import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";

export const regex =
  /\bgem\s+("|')(?<name>([\w-]+))(("|'),\s("|')(?<specifier>(.+))("|'))?/;

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

function parseSource(line: string): string | undefined {
  if (line.startsWith("source ")) {
    const splitted = line.split("source ");
    const last = splitted[splitted.length - 1];
    const source = last.replace(/["']/g, "");
    if (source.startsWith("http")) {
      return source;
    }
  }
  return undefined;
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  let source: string | undefined = undefined;
  const dependencies: [DependencyType, RawRangeType][] = [];

  for (let line = 0; line < document.lineCount; line++) {
    const { text, range } = document.lineAt(line);

    if (!source) {
      source = parseSource(text);
    }

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
    format: "gemfile",
    source,
  };
}
