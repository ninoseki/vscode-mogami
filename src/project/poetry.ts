import { flat } from "radash";
import { parse } from "smol-toml";

import { PoetryProjectSchema, type ProjectType } from "@/schemas";

import { createRegex } from "./pypi";

export function createProject(text: string): ProjectType {
  const parsed = PoetryProjectSchema.parse(parse(text));

  const format = "poetry";
  const source = (parsed.tool.poetry?.source || [])
    .map((source) => source.url)
    .find((url) => url);
  const dependencies = flat([
    Object.keys(parsed.tool.poetry.dependencies),
    Object.keys(parsed.tool.poetry["dev-dependencies"]),
    Object.keys(parsed.tool.poetry.group).flatMap((group) =>
      Object.keys(parsed.tool.poetry.group[group].dependencies),
    ),
  ]).filter((dependency) => dependency !== "python");
  const regex = createRegex(dependencies, format);
  return { dependencies, source, format, regex };
}
