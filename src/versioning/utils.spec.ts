import { eq, formatWithExistingLeading, isPrerelease } from "./utils";

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

describe("isPrerelease", () => {
  test.each([
    ["1.0.0", false],
    ["1.0", false],
    ["0.26.0b1", true],
    ["4.13.0b2", true],
  ])("isPrerelease(%s) === %s", (version: string, expected: boolean) => {
    expect(isPrerelease(version)).toBe(expected);
  });
});
