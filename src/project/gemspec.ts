import type { ProjectType } from "@/schemas";

export const regex =
  /\b\w+\.(add_development_dependency|add_runtime_dependency|add_dependency)\s+("|')(?<name>(.+))("|'),\s("|')(?<specifier>(.+))("|')/;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createProject(_text: string): ProjectType {
  return { dependencies: [], format: "gemspec", regex };
}
