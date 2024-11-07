import { flat } from "radash";
import { parse } from "smol-toml";

import { PixiProjectSchema, ProjectType } from "@/schemas";

import { createRegex } from "./pypi";

export function getDependenciesFrom(text: string): string[] {
  const parsed = PixiProjectSchema.parse(parse(text));

  return flat([
    Object.keys(parsed.tool.pixi.dependencies),
    Object.keys(parsed.tool.pixi.feature).flatMap((feature) =>
      Object.keys(parsed.tool.pixi.feature[feature].dependencies),
    ),
  ]);
}

export function createProject(text: string): ProjectType {
  const dependencies = getDependenciesFrom(text);
  const format = "pixi";
  const regex = createRegex(dependencies, format);
  return { dependencies, format, regex };
}
