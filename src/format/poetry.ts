import TOML from "@iarna/toml";
import { flat } from "radash";

import { PoetryProjectSchema, type ProjectType } from "@/schemas";

export function createProject(text: string): ProjectType {
  const parsed = PoetryProjectSchema.parse(TOML.parse(text));

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

  return { dependencies, source, format: "poetry" };
}
