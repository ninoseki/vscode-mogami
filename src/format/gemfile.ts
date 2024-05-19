import { type DependencyType } from "@/schemas";

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
