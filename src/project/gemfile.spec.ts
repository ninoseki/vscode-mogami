import { DependencyType } from "@/schemas";

import { regex } from "./gemfile";
import { nameSpecifierRegexParse } from "./utils";

const parse = (line: string) => nameSpecifierRegexParse(line, regex);

describe("parse", () => {
  it.each([
    ['  gem "pry", "~> 0.12"', { name: "pry", specifier: "~> 0.12" }],
    [
      '  gem "anyway_config", "0.0.0"',
      { name: "anyway_config", specifier: "0.0.0" },
    ],
    [
      '  gem "grape-entity", "0.0.0"',
      { name: "grape-entity", specifier: "0.0.0" },
    ],
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
