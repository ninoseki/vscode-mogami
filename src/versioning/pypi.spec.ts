import { satisfies, validateRange } from "./pypi";

describe("satisfies", () => {
  test.each([
    ["1.0.0", "== 1.0.0", true],
    ["1.0.0", "== 1.0.1", false],
    ["2.0", "~= 2.0", true],
    ["2.0.0", "~= 2.0", true],
    ["2.0", "^2.0", true],
    ["2.0", "^2.0", true],
    ["2.0.0", "^2.0", true],
    ["2.0.0.a1", ">2.0", false],
    ["2.0.0.a1", "<2.0", false],
    ["2.0.0.a1", "~=2.0", true],
  ])(
    "satisfies(%s, %s) === %s",
    (version: string, specifier: string, expected: boolean) => {
      expect(satisfies(version, { name: "dummy", specifier })).toBe(expected);
    },
  );
});

describe("validateRange", () => {
  test.each([
    [undefined, false],
    ["1.0.0", false],
    ["==1.0.0", false],
    [">=1.0.0", true],
    ["~=1.0.0", true],
    [">=1.0.0,<2.0.0", true],
    ["!=1.0.0", true],
    // invalid ranged version specifier
    [">=1.0.0 <2.0.0", false],
  ])(
    "validateRange(%s) === %s",
    (specifier: string | undefined, expected: boolean) => {
      expect(validateRange({ name: "dummy", specifier })).toBe(expected);
    },
  );
});
