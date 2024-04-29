import { formatWithExistingLeading } from "./utils";

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
