import { createProject } from "./pyproject";

const text = `[project]
name = "foo"
dependencies = [
  "httptools>=0.6.1",
  "certifi>=2022.9.24",
  "itsdangerous~=2.1.2",
]`;

describe("createPythonProject", () => {
  test("should return a project", () => {
    const project = createProject(text);
    expect(new Set(project.dependencies)).toEqual(
      new Set(["certifi", "httptools", "itsdangerous"]),
    );
  });
});
