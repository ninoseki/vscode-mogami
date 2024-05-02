import type { DependencyType } from "@/schemas";

export const gemspecRegExp =
  /\b\w+\.(add_development_dependency|add_runtime_dependency|add_dependency)[\s\t]+("|')(?<name>(.+))("|'),[\s\t]("|')(?<specifier>(.+))("|')/;

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
