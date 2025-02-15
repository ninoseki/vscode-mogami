import { satisfies } from "./gem";

describe("satisfies", () => {
  test.each([
    ["1.0.0", "1.0.0", true],
    ["1.0.0", "1.0.1", false],
    ["2.0", "~2.0", true],
    ["2.0.0", "~2.0", true],
    ["7.1.3.4", "~7.1.3.2", true],
  ])(
    "satisfies(%s, %s) === %s",
    (version: string, specifier: string, expected: boolean) => {
      expect(
        satisfies(version, {
          name: "dummy",
          specifierRequirements: [specifier],
        }),
      ).toBe(expected);
    },
  );
});
