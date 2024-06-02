import { DependencyType, ProjectFormatType } from "@/schemas";

import { buildRegex, parse } from "./pypi";

const dependencies = ["foo", "foo-bar"];

describe("parse", () => {
  test.each([
    // poetry
    ['foo = "1.0.0"', "poetry", { name: "foo", specifier: "1.0.0" }],
    ['foo = ">=1.0,<2.0"', "poetry", { name: "foo", specifier: ">=1.0,<2.0" }],
    ['foo = "^1.0"', "poetry", { name: "foo", specifier: "^1.0" }],
    ['foo-bar = "^1.0"', "poetry", { name: "foo-bar", specifier: "^1.0" }],
    [
      'foo = { extras = ["standard"], version = "^0.29.0" }',
      "poetry",
      { name: "foo", specifier: "^0.29.0" },
    ],
    [
      'foo = { extras = ["standard"], version = ">=1.0,<2.0" }',
      "poetry",
      { name: "foo", specifier: ">=1.0,<2.0" },
    ],
    // pyproject.toml
    ['"foo==1.0.0",', "pyproject", { name: "foo", specifier: "==1.0.0" }],
    ['"foo>=1.0,<2.0"', "pyproject", { name: "foo", specifier: ">=1.0,<2.0" }],
    // requirements.txt
    ["foo == 1.0.0", "requirements", { name: "foo", specifier: "== 1.0.0" }],
    ["foo ~= 1.0.0", "requirements", { name: "foo", specifier: "~= 1.0.0" }],
    ["foo != 1.0.0", "requirements", { name: "foo", specifier: "!= 1.0.0" }],
    ["foo <= 1.0.0", "requirements", { name: "foo", specifier: "<= 1.0.0" }],
    ["foo < 1.0.0", "requirements", { name: "foo", specifier: "< 1.0.0" }],
    ["foo == 1.*", "requirements", { name: "foo", specifier: "== 1.*" }],
    ["foo == *", "requirements", { name: "foo", specifier: "== *" }],
    [
      "foo[extra] == 1.0.0",
      "requirements",
      { name: "foo", specifier: "== 1.0.0" },
    ],
  ])(
    "parse(%s, %s) === %s",
    (line: string, format: string, expected: DependencyType) => {
      const regex = buildRegex(dependencies, format as ProjectFormatType);
      const deps = parse(line, regex);
      expect(deps).not.toBeUndefined();
      expect(deps?.name).toBe(expected?.name);
      expect(deps?.specifier).toBe(expected?.specifier);
    },
  );
});
