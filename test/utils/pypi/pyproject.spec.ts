import { getDependenciesFrom, ManifestFileNotValid } from "@/utils/pyproject";

describe("when loading manifest files", () => {
  describe("getDependenciesFrom", () => {
    it("should throw exception if tools.poetry stanza not found", () => {
      expect(() => getDependenciesFrom("", false)).toThrow(
        ManifestFileNotValid,
      );
    });

    it("should return list of dependency package names", () => {
      const fileContents = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      pkg_b = "^1.0"`;
      const poetryDependencies = getDependenciesFrom(fileContents, false);
      expect(poetryDependencies.length).toBe(2);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_a")).toBe(true);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_b")).toBe(true);
    });

    it("should not return python if listed as a dependency", () => {
      const fileContents = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      python = "~2.7 || ^3.5"`;
      const poetryDependencies = getDependenciesFrom(fileContents, false);
      expect(poetryDependencies.length).toBe(1);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_a")).toBe(true);
      expect(poetryDependencies.some((dep) => dep.name === "python")).toBe(
        false,
      );
    });

    it("should include devDependencies when asked to", () => {
      // tool.poetry.dev-dependencies
      const fileContents = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      [tool.poetry.dev-dependencies]
      pkg_b = "^1.0"`;
      const poetryDependencies = getDependenciesFrom(fileContents, true);
      expect(poetryDependencies.length).toBe(2);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_a")).toBe(true);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_b")).toBe(true);

      // tool.poetry.group.<group>
      const fileContents2 = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      [tool.poetry.group.dev.dependencies]
      pkg_c = "^1.0"
      `;
      const poetryDependencies2 = getDependenciesFrom(fileContents2, true);
      expect(poetryDependencies2.length).toBe(2);
      expect(poetryDependencies2.some((dep) => dep.name === "pkg_a")).toBe(
        true,
      );
      expect(poetryDependencies2.some((dep) => dep.name === "pkg_c")).toBe(
        true,
      );

      // tool.poetry.dev-dependencies & tool.poetry.group.<group>
      const fileContents3 = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      [tool.poetry.dev-dependencies]
      pkg_b = "^1.0"
      [tool.poetry.group.dev.dependencies]
      pkg_c = "^1.0"
      `;
      const poetryDependencies3 = getDependenciesFrom(fileContents3, true);
      expect(poetryDependencies3.length).toBe(3);
      expect(poetryDependencies3.some((dep) => dep.name === "pkg_a")).toBe(
        true,
      );
      expect(poetryDependencies3.some((dep) => dep.name === "pkg_b")).toBe(
        true,
      );
      expect(poetryDependencies3.some((dep) => dep.name === "pkg_c")).toBe(
        true,
      );

      // tool.poetry.dev-dependencies & multiple tool.poetry.group.<group>
      const fileContents4 = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      [tool.poetry.dev-dependencies]
      pkg_b = "^1.0"
      [tool.poetry.group.dev.dependencies]
      pkg_c = "^1.0"
      [tool.poetry.group.more-dev.dependencies]
      pkg_d = "^1.0"
      [tool.poetry.group.even-more-dev.dependencies]
      pkg_e = "^1.0"
      `;
      const poetryDependencies4 = getDependenciesFrom(fileContents4, true);
      expect(poetryDependencies4.length).toBe(5);
      expect(poetryDependencies4.some((dep) => dep.name === "pkg_a")).toBe(
        true,
      );
      expect(poetryDependencies4.some((dep) => dep.name === "pkg_b")).toBe(
        true,
      );
      expect(poetryDependencies4.some((dep) => dep.name === "pkg_c")).toBe(
        true,
      );
      expect(poetryDependencies4.some((dep) => dep.name === "pkg_d")).toBe(
        true,
      );
      expect(poetryDependencies4.some((dep) => dep.name === "pkg_e")).toBe(
        true,
      );
    });

    it("should not include devDependencies when not asked to", () => {
      const fileContents = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      [tool.poetry.dev-dependencies]
      pkg_b = "^1.0"`;
      const poetryDependencies = getDependenciesFrom(fileContents, false);
      expect(poetryDependencies.length).toBe(1);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_a")).toBe(true);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_b")).toBe(
        false,
      );

      const fileContents2 = `[tool.poetry.dependencies]
      pkg_a = "^2.11"
      [tool.poetry.dev-dependencies]
      pkg_b = "^1.0"
      [tool.poetry.group.dev.dependencies]
      pkg_c = "^1.0"
      [tool.poetry.group.more-dev.dependencies]
      pkg_d = "^1.0"
      `;
      const poetryDependencies2 = getDependenciesFrom(fileContents2, false);
      expect(poetryDependencies2.length).toBe(1);
      expect(poetryDependencies2.some((dep) => dep.name === "pkg_a")).toBe(
        true,
      );
      expect(poetryDependencies2.some((dep) => dep.name === "pkg_b")).toBe(
        false,
      );
      expect(poetryDependencies2.some((dep) => dep.name === "pkg_c")).toBe(
        false,
      );
      expect(poetryDependencies2.some((dep) => dep.name === "pkg_d")).toBe(
        false,
      );
    });

    it("should not return any dependencies when dependency stanza not present", () => {
      const poetryDependencies = getDependenciesFrom("[tool.poetry]", false);
      expect(poetryDependencies.length).toBe(0);
    });

    it("should handle quoted keys in inline tables", () => {
      const fileContents = `[tool.poetry.dependencies]
      pkg_a = {"version" = "^1.0"}`;
      const poetryDependencies = getDependenciesFrom(fileContents, false);
      expect(poetryDependencies.length).toBe(1);
      expect(poetryDependencies.some((dep) => dep.name === "pkg_a")).toBe(true);
    });
  });
});
