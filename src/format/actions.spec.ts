import { DependencyType } from "@/schemas";

import { regex } from "./actions";
import { nameSpecifierRegexParse } from "./utils";

const parse = (line: string) => nameSpecifierRegexParse(line, regex);

describe("parse", () => {
  it.each([
    [
      "uses: actions/checkout@v4",
      { name: "actions/checkout", specifier: "v4" },
    ],
    [
      "uses: actions/setup-python@v5",
      { name: "actions/setup-python", specifier: "v5" },
    ],
  ])("parse(%s) === %s", (line: string, expected: DependencyType) => {
    const deps = parse(line);
    expect(deps).not.toBeUndefined();
    expect(deps?.name).toBe(expected?.name);
    expect(deps?.specifier).toBe(expected?.specifier);
  });
});
