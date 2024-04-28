import { DependencyType } from "@/schemas";

import { parse } from "./gemfileLock";

describe("parse", () => {
  test.each([
    [
      "concurrent-ruby (1.2.3)",
      { name: "concurrent-ruby", specifier: "1.2.3" },
    ],
    ["simplecov (~> 0.22.0)", { name: "simplecov", specifier: "~> 0.22.0" }],
  ])("parse(%s) === %s", (line: string, expected: DependencyType) => {
    const deps = parse(line);
    expect(deps).not.toBeUndefined();
    expect(deps?.name).toBe(expected?.name);
    expect(deps?.specifier).toBe(expected?.specifier);
  });
});
