import { DependencyType } from "@/schemas";

import {
  compare,
  eq,
  formatWithExistingLeading,
  isPrerelease,
  preCoerce,
  removeLeading,
  validateRange,
} from "./utils";

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
    ["1.0", "1.1", false],
    ["1.0.0.1", "1.0.0.1", true],
    ["1.0.0.1", "1.0.0.2", false],
    ["~ 1.0.0.1", "1.0.0.1", true],
    ["~ 1.0.0.1", "1.0.0.2", false],
    // semver with pre-release
    ["1.0.0-alpha.1", "1.0.0-alpha.1", true],
    ["1.0.0-alpha.1", "1.0.0-alpha.2", false],
    ["1.0.0", "1.0.0-alpha.1", false],
    // non standard pre-release
    ["7.2.0.beta2", "7.2.0.beta2", true],
    ["7.2.0.beta2", "7.2.0.beta1", false],
  ])(
    "eq(%s, %s) === %s",
    (version: string, specifier: string, expected: boolean) => {
      expect(eq(version, specifier)).toBe(expected);
    },
  );
});

describe("compare", () => {
  test.each([
    ["1.0.0", "1.0.0", 0],
    ["1.0.0", "1.0.1", -1],
    ["1.0.0", "0.9.0", 1],
    ["1.0.1", "1.0.1.1", -1],
    ["1.0.1.1", "1.0.1", 1],
    // semver with pre-release
    ["1.0.0-alpha.1", "1.0.0-alpha.1", 0],
    ["1.0.0-alpha.1", "1.0.0-alpha.2", -1],
    ["1.0.0", "1.0.0-alpha.1", 1],
    // non-standard pre-release
    ["7.2.0.beta1", "7.2.0.beta2", -1],
    ["1.0.0", "1.0.0.a2", 1],
    ["1.0.0", "1.0.0-alpha.1", 1],
    ["1.0.0.a1", "1.0.0.a2", -1],
    ["1.0.0.a1", "1.0.0.b1", -1],
  ])(
    "eq(%s, %s) === %s",
    (version: string, specifier: string, expected: number) => {
      expect(compare(version, specifier)).toBe(expected);
    },
  );
});

describe("removeLeading", () => {
  test.each([
    ["== 1.0.0", "1.0.0"],
    ["==1.0.0", "1.0.0"],
    [">1.0", "1.0"],
    ["> 1.0", "1.0"],
    ["~1.0", "1.0"],
    ["~ 1.0", "1.0"],
    ["^ 1.0", "1.0"],
    ["^1.0", "1.0"],
    [">=1.0", "1.0"],
    [">= 1.0", "1.0"],
    ["<= 1.0", "1.0"],
    ["<=1.0", "1.0"],
    ["~> 1.0", "1.0"],
    ["~>1.0", "1.0"],
    ["~= 1.0", "1.0"],
    ["~=1.0", "1.0"],
  ])("removeLeading(%s) === %s", (version: string, expected: string) => {
    expect(removeLeading(version)).toBe(expected);
  });
});

describe("preCoerce", () => {
  test.each([
    ["1.0.0", "1.0.0"],
    ["1.0.0-alpha.1", "1.0.0-alpha.1"],
    ["1.0.0-alpha1", "1.0.0-alpha.1"],
    ["1.0.0.a1", "1.0.0-alpha.1"],
    ["1.0.0.b1", "1.0.0-beta.1"],
    ["1.0.0-beta1", "1.0.0-beta.1"],
  ])("preCoerce(%s) === %s", (version: string, expected: string) => {
    expect(preCoerce(version)).toBe(expected);
  });
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

describe("validateRange", () => {
  test.each([
    [{ name: "dummy", specifier: undefined }, false],
    [{ name: "dummy", specifier: "1.0" }, false],
    [{ name: "dummy", specifier: ">1.0" }, true],
    [{ name: "dummy", specifier: ">1.0 <2.0" }, true],
    [{ name: "dummy", specifierRequirements: ["1.0"] }, false],
    [{ name: "dummy", specifierRequirements: ["==1.0"] }, false],
    [{ name: "dummy", specifierRequirements: [">1.0", "<2.0"] }, true],
  ])("validateRange(%s) === %s", (v: DependencyType, expected: boolean) => {
    expect(validateRange(v)).toBe(expected);
  });
});
