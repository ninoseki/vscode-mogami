import type { DependencyPosType } from "@/schemas";

export const gemfileLockRegExp =
  /\b(?<name>([a-zA-z0-9-_]+))\s\((?<specifier>(.+))\)/;

export function parse(line: string): DependencyPosType | undefined {
  const matches = gemfileLockRegExp.exec(line);
  if (!matches) {
    return undefined;
  }
  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }
  const specifier = matches.groups?.specifier;
  return { name, specifier, pos: matches.index };
}
