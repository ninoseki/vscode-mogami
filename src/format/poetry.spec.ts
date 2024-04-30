import { DependencyType } from "@/schemas";

import { buildDepsRegExp, parse } from "./poetry";

const regExp = buildDepsRegExp(`
[tool.poetry.dependencies]
python = "^3.10"
foo = "1.0.0"
`);

describe("parse", () => {
  test.each([
    ['foo = "1.0.0"', { name: "foo", specifier: "1.0.0" }],
    ['foo = ">=1.0,<2.0"', { name: "foo", specifier: ">=1.0,<2.0" }],
    ['foo = "^1.0"', { name: "foo", specifier: "^1.0" }],
    [
      'foo = { extras = ["standard"], version = "^0.29.0" }',
      { name: "foo", specifier: "^0.29.0" },
    ],
    [
      'foo = { extras = ["standard"], version = ">=1.0,<2.0" }',
      { name: "foo", specifier: ">=1.0,<2.0" },
    ],
  ])("parse(%s) === %s", (line: string, expected: DependencyType) => {
    const deps = parse(line, regExp);
    expect(deps).not.toBeUndefined();
    expect(deps?.name).toBe(expected?.name);
    expect(deps?.specifier).toBe(expected?.specifier);
  });
});
