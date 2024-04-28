import { DependencyType } from "@/schemas";

import { parse } from "./gemfile";

describe("parse", () => {
  it.each([
    ['  gem "pry", "~> 0.12"', { name: "pry", specifier: "~> 0.12" }],
    [
      `  gem "coveralls", "~> 0.8", require: false`,
      { name: "coveralls", specifier: "~> 0.8" },
    ],
    [`gem "rails"`, { name: "rails", specifier: undefined }],
  ])("parse(%s) === %s", (line: string, expected: DependencyType) => {
    const deps = parse(line);
    expect(deps).not.toBeUndefined();
    expect(deps?.name).toBe(expected?.name);
    expect(deps?.specifier).toBe(expected?.specifier);
  });
});
