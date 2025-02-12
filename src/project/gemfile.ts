import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";

export function parseLineAsDependencyByRegExp(
  line: string,
  regexp: RegExp,
): DependencyType | undefined {
  const matches = regexp.exec(line);

  if (!matches) {
    return undefined;
  }

  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }
  const specifier = (() => {
    const s = matches.groups?.specifier;
    if (!s) {
      return undefined;
    }
    const mapper = (s: string): string => {
      // replace tabs inside & trim afterwards
      // (tab should not be included because it's used as a delimiter)
      return s.replaceAll("\t", "").trim();
    };
    // join requirements in a specifier with tab
    return s.replace(/["']/g, "").split(",").map(mapper).join("\t");
  })();

  return { name, specifier, type: "ProjectName" };
}

export const regexp =
  /\bgem\s+("|')(?<name>([\w-]+))(("|'),\s("|')(?<specifier>(.+))("|'))?/;

export function parseLineAsDependency(
  line: string,
): DependencyType | undefined {
  return parseLineAsDependencyByRegExp(line, regexp);
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
