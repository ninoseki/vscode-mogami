import { eq, formatWithExistingLeading } from "./utils";

describe("formatWithExistingLeading", () => {
  test.each([
    ["== 1.0.0", "2.0.0", "== 2.0.0"],
    [">= 1.0.0", "2.0.0", ">= 2.0.0"],
    ["~1.0", "2.0.0", "~2.0.0"],
  ])(
    "formatWithExistingLeading(%s) === %s",
    (oldVersion: string, newVersion: string, expected: string) => {
      expect(formatWithExistingLeading(oldVersion, newVersion)).toBe(expected);
    },
  );
});

describe("eq", () => {
  test.each([
    ["1.0.0", "1.0.0", true],
    ["1.0.0", "2.0.0", false],
    ["1.0.0", "~1.0", true],
    ["1.0.0", "~2.0", false],
    ["1,0", "1.0", true],
    ["1,0", "1.1", false],
  ])(
    "eq(%s, %s) === %s",
    (version: string, specifier: string, expected: boolean) => {
      expect(eq(version, specifier)).toBe(expected);
    },
  );
});
