import { GemDependency } from "@/types";
import { extractDependencyByMapper, gemfileMapper } from "@/utils/gem";

describe("extractDependencyByMapper", () => {
  it.each([
    ['  gem "pry", "~> 0.12"', { name: "pry", requirements: "~> 0.12" }],
    [
      `  gem "coveralls", "~> 0.8", require: false`,
      { name: "coveralls", requirements: "~> 0.8" },
    ],
    [`gem "rails"`, { name: "rails", requirements: undefined }],
  ])("should return dependency", (line: string, expected: GemDependency) => {
    const dep = extractDependencyByMapper(line, gemfileMapper);

    expect(dep).not.toBeUndefined();
    expect(dep?.name).toBe(expected?.name);
    expect(dep?.requirements).toBe(expected?.requirements);
  });

  it.each([["foo bar"]])("should return undefined", (line: string) => {
    const dep = extractDependencyByMapper(line, gemfileMapper);
    expect(dep).toBeUndefined();
  });
});
