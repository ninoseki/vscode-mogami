import type { DependencyType, ProjectType } from "@/schemas";

export const gemspecRegExp =
  /\b\w+\.(add_development_dependency|add_runtime_dependency|add_dependency)\s+("|')(?<name>(.+))("|'),\s("|')(?<specifier>(.+))("|')/;

export function parse(line: string): DependencyType | undefined {
  const matches = gemspecRegExp.exec(line);
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

export function createProject(text: string): ProjectType {
  const dependencies = text
    .split("\n")
    .map(parse)
    .map((d) => d?.name)
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);

  return { dependencies, format: "gemspec" };
}
