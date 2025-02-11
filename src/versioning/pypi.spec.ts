import { satisfies, validRange } from "./pypi";

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
      expect(satisfies(version, specifier)).toBe(expected);
    },
  );
});

describe("validRange", () => {
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
    "validRange(%s) === %s",
    (specifier: string | undefined, expected: boolean) => {
      expect(validRange(specifier)).toBe(expected);
    },
  );
});
