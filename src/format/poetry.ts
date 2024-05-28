import TOML from "@iarna/toml";
import { getDependenciesFrom } from "snyk-poetry-lockfile-parser/dist/manifest-parser";

import { Logger } from "@/logger";
import { PoetryProjectSchema, type ProjectType } from "@/schemas";

export function createProject(text: string): ProjectType {
  // TODO: replace it with Zod
  const dependencies = getDependenciesFrom(text, true).map((d) => d.name);
  const parsed = PoetryProjectSchema.parse(TOML.parse(text));
  const source = (parsed.tool.poetry?.source || [])
    .map((source) => source.url)
    .find((url) => url);

  Logger.info(`Poetry detected: ${dependencies.length} dependencies found`);
  if (dependencies.length === 0) {
    throw new Error("No dependency found in Poetry manifest");
  }

  return { dependencies, source, format: "poetry" };
}
