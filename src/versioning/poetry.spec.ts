import { satisfies } from "./poetry";

describe("satisfies", () => {
  test.each([
    ["1.0.0", "== 1.0.0", true],
    ["1.0.0", "== 1.0.1", false],
    ["2.0", "~= 2.0", true],
    ["2.0.0", "~= 2.0", true],
    ["2.0", "^2.0", true],
    ["2.0", "^2.0", true],
    ["2.0.0", "^2.0", true],
  ])(
    "satisfies(%s, %s) === %s",
    (version: string, specifier: string, expected: boolean) => {
      expect(satisfies(version, specifier)).toBe(expected);
    },
  );
});
