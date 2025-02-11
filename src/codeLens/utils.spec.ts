import * as E from "fp-ts/lib/Either";

import { DependencyType, PackageType, SatisfiesFnType } from "@/schemas";
import { satisfies, validRange } from "@/versioning/utils";

import { createPackageSuggestions, PackageSuggestion } from "./utils";

describe("createPackageSuggestions", () => {
  test.each([
    // latest & fixed specifier
    [
      { name: "foo", specifier: "1.0.0" } as DependencyType,
      { name: "foo", version: "1.0.0", versions: ["1.0.0"] } as PackageType,
      satisfies,
      [{ title: "🟢 latest 1.0.0", command: "" }] as PackageSuggestion[],
    ],
    // outdated & fixed specifier
    [
      { name: "foo", specifier: "1.0.0" } as DependencyType,
      { name: "foo", version: "2.0.0", versions: ["2.0.0"] } as PackageType,
      satisfies,
      [
        { title: "🟡 fixed 1.0.0", command: "" },
        {
          command: "vscode-mogami.suggestions.updateDependencyClick",
          replaceable: true,
          title: "↑ latest 2.0.0",
        },
      ] as PackageSuggestion[],
    ],
    // outdated & range specifier (satisfies)
    [
      { name: "foo", specifier: ">=1.0.0" } as DependencyType,
      {
        name: "foo",
        version: "2.0.0",
        versions: ["2.0.0", "1.0.0"],
      } as PackageType,
      satisfies,
      [
        {
          command: "",
          title: "🟡 satisfies latest 2.0.0",
        },
        {
          command: "vscode-mogami.suggestions.updateDependencyClick",
          replaceable: true,
          title: "↑ latest 2.0.0",
        },
      ] as PackageSuggestion[],
    ],
    // outdated & range specifier (un-satisfies)
    [
      { name: "foo", specifier: ">=1.0.0,<2.0.0" } as DependencyType,
      {
        name: "foo",
        version: "2.0.0",
        versions: ["2.0.0", "1.0.0"],
      } as PackageType,
      satisfies,
      [
        {
          command: "vscode-mogami.suggestions.updateDependencyClick",
          replaceable: true,
          title: "↑ latest 2.0.0",
        },
      ] as PackageSuggestion[],
    ],
    // outdated & range specifier (un-satisfies & has newer version)
    [
      { name: "foo", specifier: ">=1.0.0 <2.0.0" } as DependencyType,
      {
        name: "foo",
        version: "2.0.0",
        versions: ["2.0.0", "1.1.0", "1.0.0"],
      } as PackageType,
      satisfies,
      [
        {
          command: "",
          title: "🟡 satisfies 1.1.0",
        },
        {
          command: "vscode-mogami.suggestions.updateDependencyClick",
          replaceable: true,
          title: "↑ latest 2.0.0",
        },
      ] as PackageSuggestion[],
    ],
  ])(
    "createPackageSuggestions(%s, %s, %s) === %s",
    (
      dependency: DependencyType,
      pkg: PackageType,
      satisfies: SatisfiesFnType,
      expected: PackageSuggestion[],
    ) => {
      const pkgResult = E.right(pkg);
      expect(
        createPackageSuggestions({
          dependency,
          pkgResult,
          satisfies,
          validRange,
        }),
      ).toEqual(expected);
    },
  );
});
