import { DependencyType } from "@/schemas";

import { parse } from "./poetry";
import { buildDepsRegExp } from "./pyproject";

const regExp = buildDepsRegExp(`
[project]
dependencies = [
  "foo>=0.0",
  "foo-bar>=0.0"
]
`);

describe("parse", () => {
  test.each([
    ['"foo==1.0.0",', { name: "foo", specifier: "==1.0.0" }],
    ['"foo>=1.0,<2.0"', { name: "foo", specifier: ">=1.0,<2.0" }],
  ])("parse(%s) === %s", (line: string, expected: DependencyType) => {
    const deps = parse(line, regExp);
    expect(deps).not.toBeUndefined();
    expect(deps?.name).toBe(expected?.name);
    expect(deps?.specifier).toBe(expected?.specifier);
  });
});
