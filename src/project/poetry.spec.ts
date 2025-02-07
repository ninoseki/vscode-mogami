import { createProject } from "./poetry";

describe("createPythonProject", () => {
  describe("with Poetry v1", () => {
    const text = `[tool.poetry]
    name = "sqlmodel-filters"
    version = "0.0.0"

    [[tool.poetry.source]]
    name = "private"
    url = "http://example.com/simple"

    [tool.poetry.dependencies]
    python = "^3.10"
    luqum = "^0.13"
    sqlmodel = ">=0.0.16,<1.0"

    [tool.poetry.group.dev.dependencies]
    mypy = "^1.9"
    pre-commit = "^3.7"
    pytest = "^8.1"
    pytest-pretty = "^1.2"
    pytest-randomly = "^3.15"
    pyupgrade = "^3.15"
    ruff = "^0.4"`;

    test("should return a project", () => {
      const project = createProject(text);
      expect(project.source).toBe("http://example.com/simple");
      expect(new Set(project.dependencies)).toEqual(
        new Set([
          "luqum",
          "sqlmodel",
          "mypy",
          "pre-commit",
          "pytest",
          "pytest-pretty",
          "pytest-randomly",
          "pyupgrade",
          "ruff",
        ]),
      );
    });
  });

  describe("with Poetry v2", () => {
    const text = `[project]
name = "poetry-demo"
version = "0.1.0"
description = ""
authors = [{ name = "Sébastien Eustace", email = "sebastien@eustace.io" }]
readme = "README.md"
requires-python = ">=3.8"
dependencies = [
  "fastapi>=0.100",
]

[tool.poetry]
packages = [{ include = "poetry_demo" }]

[build-system]
requires = ["poetry-core>=2.0"]
build-backend = "poetry.core.masonry.api"

[tool.poetry.group.dev.dependencies]
django-stubs = "^5.1.2"`;

    test("should return a project", () => {
      const project = createProject(text);
      expect(new Set(project.dependencies)).toEqual(
        new Set(["fastapi", "django-stubs"]),
      );
    });
  });
});
