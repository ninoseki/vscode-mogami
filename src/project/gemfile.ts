import { ProjectType } from "@/schemas";

export const regex =
  /\bgem\s+("|')(?<name>([\w-]+))(("|'),\s("|')(?<specifier>(.+))("|'))?/;

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
  const source = getSource(text);
  return { dependencies: [], format: "gemfile", source, regex };
}
