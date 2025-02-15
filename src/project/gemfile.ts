import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";
import { compare, removeLeading } from "@/versioning/utils";

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
  const specifierRequirements = (() => {
    const s = matches.groups?.specifier;
    if (!s) {
      return undefined;
    }
    // join requirements in a specifier with tab
    return s
      .replace(/["']/g, "")
      .split(",")
      .map((s) => s.trim());
  })();

  // set the biggest requirement (without leading) as a specifier to make it compatible with other formats
  const specifier = (() => {
    if (!specifierRequirements) {
      return undefined;
    }
    const compareWithoutLeading = (v1: string, v2: string) => {
      return compare(removeLeading(v1), removeLeading(v2));
    };
    const sorted = specifierRequirements.sort(compareWithoutLeading);
    return sorted[sorted.length - 1];
  })();

  return { name, specifier, specifierRequirements, type: "ProjectName" };
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
