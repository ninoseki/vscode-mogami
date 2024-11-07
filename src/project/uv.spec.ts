import { createProject } from "./uv";

const text = `[project]
name = "foo"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.112.2",
]

[project.optional-dependencies]
foo = ["mkdocs>=1.6.0"]

[dependency-groups]
test = ["coverage"]
all = [{include-group = "test"}]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.uv]
dev-dependencies = [
    "pytest>=8.3.2",
]`;

describe("createPythonProject", () => {
  test("should return a project", () => {
    const project = createProject(text);
    expect(new Set(project.dependencies)).toEqual(
      new Set(["coverage", "fastapi", "mkdocs", "pytest"]),
    );
  });
});
