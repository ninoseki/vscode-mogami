import { ProjectType } from "@/schemas";

import { nameSpecifierRegexParse } from "./utils";

export const regex = /uses:\s?(?<name>[\w\-\\/]+)@(?<specifier>.+)/;

export function createProject(text: string): ProjectType {
  const dependencies = text
    .split("\n")
    .map((line) => nameSpecifierRegexParse(line, regex))
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined)
    .map((deps) => deps.name);
  return { dependencies, format: "actions", source: undefined, regex };
}
