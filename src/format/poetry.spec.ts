import { createProject } from "./poetry";

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

describe("createPythonProject", () => {
  test("should return a project", () => {
    const project = createProject(text);
    expect(project.source).toBe("http://example.com/simple");
    expect(project.dependencies).toEqual([
      "luqum",
      "sqlmodel",
      "mypy",
      "pre-commit",
      "pytest",
      "pytest-pretty",
      "pytest-randomly",
      "pyupgrade",
      "ruff",
    ]);
  });
});
