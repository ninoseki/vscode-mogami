import { DependencyType } from "@/schemas";

import { parse } from "./pip";

describe("parse", () => {
  test.each([
    ["foo == 1.0.0", { name: "foo", specifier: "== 1.0.0" }],
    ["foo ~= 1.0.0", { name: "foo", specifier: "~= 1.0.0" }],
    ["foo != 1.0.0", { name: "foo", specifier: "!= 1.0.0" }],
    ["foo <= 1.0.0", { name: "foo", specifier: "<= 1.0.0" }],
    ["foo < 1.0.0", { name: "foo", specifier: "< 1.0.0" }],
    ["foo == 1.*", { name: "foo", specifier: "== 1.*" }],
    ["foo == *", { name: "foo", specifier: "== *" }],
    ["foo[extra] == 1.0.0", { name: "foo", specifier: "== 1.0.0" }],
  ])("parse(%s) === %s", (line: string, expected: DependencyType) => {
    const deps = parse(line);
    expect(deps).not.toBeUndefined();
    expect(deps?.name).toBe(expected?.name);
    expect(deps?.specifier).toBe(expected?.specifier);
  });
});
