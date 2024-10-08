import TOML from "@iarna/toml";
import { flat } from "radash";

import { PixiProjectSchema, ProjectType } from "@/schemas";

import { createRegex } from "./pypi";

export function getDependenciesFrom(text: string): string[] {
  const tomlParsed = TOML.parse(text);
  const parsed = PixiProjectSchema.parse(tomlParsed);

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
