import { parse as _parse } from "@/project/gem";
import { DependencyType } from "@/schemas";

import { regex } from "./gemspec";

const parse = (line: string) => _parse(line, regex);

describe("parse", () => {
  test.each([
    [
      '  spec.add_development_dependency "bundler", "~> 2.0"',
      { name: "bundler", specifier: "~> 2.0" },
    ],
    [
      'spec.add_dependency "addressable", "~> 2.8"',
      { name: "addressable", specifier: "~> 2.8" },
    ],
  ])("parse(%s) === %s", (line: string, expected: DependencyType) => {
    const deps = parse(line);
    expect(deps).not.toBeUndefined();
    expect(deps?.name).toBe(expected?.name);
    expect(deps?.specifier).toBe(expected?.specifier);
  });
});
