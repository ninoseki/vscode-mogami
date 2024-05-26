import { type DependencyType, ProjectType } from "@/schemas";

export const gemfileRegExp =
  /\bgem\s+("|')(?<name>([\w-]+))(("|'),\s("|')(?<specifier>(.+))("|'))?/;

export function parse(line: string): DependencyType | undefined {
  const matches = gemfileRegExp.exec(line);
  if (!matches) {
    return undefined;
  }
  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }
  const specifier = matches.groups?.specifier;
  return { name, specifier };
}

function getSource(text: string): string | undefined {
  const parseSource = (line: string) => {
    if (line.startsWith("source ")) {
      const splitted = line.split("source ");
      const last = splitted[splitted.length - 1];
      const source = last.replace(/["']/g, "");
      if (source.startsWith("http")) {
        return source;
      }
    }
  };
  return text
    .split("\n")
    .map(parseSource)
    .find((i) => i !== undefined);
}

export function createProject(text: string): ProjectType {
  const dependencies = text
    .split("\n")
    .map(parse)
    .map((d) => d?.name)
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);

  const source = getSource(text);

  return { dependencies, format: "gemfile", source };
}
