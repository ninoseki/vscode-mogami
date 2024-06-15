import { DependencyType } from "@/schemas";

export function nameSpecifierRegexParse(
  line: string,
  regex: RegExp,
): DependencyType | undefined {
  const matches = regex.exec(line);
  if (!matches) {
    return undefined;
  }
  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }
  const specifier = matches.groups?.specifier?.trim();
  return { name, specifier };
}
