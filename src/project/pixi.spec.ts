import { createProject } from "./pixi";

const text = `[project]
name = "pixi-py"
version = "0.1.0"
requires-python = ">= 3.11"

[tool.pixi.dependencies]
black = ">=24.4.2,<25"
fastapi = ">=0.112.0,<0.113"

[tool.pixi.feature.test.dependencies]
pytest = "*"`;

describe("createPythonProject", () => {
  test("should return a project", () => {
    const project = createProject(text);
    expect(new Set(project.dependencies)).toEqual(
      new Set(["black", "fastapi", "pytest"]),
    );
  });
});
