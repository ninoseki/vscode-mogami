import { createPythonProject } from "./requirements";

const text = `--index-url https://example.com/simple
poetry==1.8.2`;

describe("createPythonProject", () => {
  test("should return a project", () => {
    const project = createPythonProject(text);
    expect(project.source).toBe("https://example.com/simple");
    expect(project.dependencies).toEqual(["poetry"]);
  });
});
