import { flat } from "radash";
import { unique } from "radash";
import { parse } from "smol-toml";

import { PoetryProjectSchema, type ProjectType } from "@/schemas";

import { createRegex } from "./pypi";
import { parse as pipParse } from "./requirements";

export function createProject(text: string): ProjectType {
  const parsed = PoetryProjectSchema.parse(parse(text));

  const format = "poetry";
  const source = (parsed.tool.poetry?.source || [])
    .map((source) => source.url)
    .find((url) => url);

  const poetryDependencies = flat([
    Object.keys(parsed.tool.poetry.dependencies),
    Object.keys(parsed.tool.poetry["dev-dependencies"]),
    Object.keys(parsed.tool.poetry.group).flatMap((group) =>
      Object.keys(parsed.tool.poetry.group[group].dependencies),
    ),
  ]).filter((dependency) => dependency !== "python");

  // Poetry v2 has started supporting PEP 621
  const pep621Dependencies = parsed.project?.dependencies || [];
  const pep621OptionalDependencies = Object.values(
    parsed.project?.optionalDependencies || {},
  ).flat();
  const unifiedPep621Dependencies = [
    pep621Dependencies,
    pep621OptionalDependencies,
  ]
    .flat()
    .map((dependency) => {
      const pipParsed = pipParse(dependency);
      return pipParsed?.name;
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);

  // Combine dependencies from both sources (which is unlikely to happen but)
  const dependencies = unique([
    ...poetryDependencies,
    ...unifiedPep621Dependencies,
  ]);

  const regex = createRegex(dependencies, format);
  return { dependencies, source, format, regex };
}
