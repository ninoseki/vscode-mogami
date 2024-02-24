import type { GemType } from "@/schemas";
import type { GemDependency } from "@/types";

export function quoteMapper(line: string): string {
  const quoteIndex = line.indexOf("'");
  const start = quoteIndex >= 0 ? quoteIndex : line.indexOf('"') || 0;
  return line.slice(start);
}

export function extractDependencyByMapper(
  line: string,
  mapper: (s: string) => GemDependency | undefined,
  minLength = 2,
): GemDependency | undefined {
  const dep = mapper(line);
  if (!dep) {
    return undefined;
  }

  if (dep.name.length < minLength) {
    return undefined;
  }

  return dep;
}

export function gemfileLockMapper(line: string): GemDependency | undefined {
  const parts = line.trim().split(" ");
  const name = parts.shift() || "";
  const requirements = parts.join(" ").trim().slice(1, -1);

  return { name, requirements };
}

export function gemfileMapper(line: string): GemDependency | undefined {
  const mapped = quoteMapper(line);
  const parts = mapped
    .trim()
    .split(",")
    .map((s) => s.trim().replace(/'|"/g, ""));

  if (parts.length >= 1) {
    const name = parts[0];
    const requirements = parts[1];
    return { name, requirements };
  }
  return undefined;
}

export function gemspecMapper(line: string): GemDependency | undefined {
  const mapped = quoteMapper(line);
  const parts = mapped
    .trim()
    .split(",")
    .map((s) => s.trim().replace(/'|"/g, ""));

  if (parts.length >= 1) {
    const name = parts[0];
    const requirements = parts[1];
    return { name, requirements };
  }
  return undefined;
}

export function buildMessage(gem: GemType): string {
  return `${gem.info}\n\nLatest version: ${gem.version}\n\n${gem.homepage_uri}`;
}
