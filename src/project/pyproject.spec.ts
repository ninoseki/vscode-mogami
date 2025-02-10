// forked from https://github.com/Twixes/pypi-assistant/
import type { TextDocumentLikeType } from "@/schemas";

import { parseProject } from "./pyproject";

export function makeTextDocumentLike(lines: string[]): TextDocumentLikeType {
  return {
    getText: vi.fn(() => lines.join("\n")),
    lineAt: vi.fn((line) => ({
      text: lines[line],
      range: {
        start: { line, character: 0 },
        end: { line, character: lines[line].length - 2 },
      },
    })),
    lineCount: lines.length,
  };
}

describe("parseProject with Poetry", () => {
  it("should extract basic requirements", () => {
    const document = makeTextDocumentLike([
      "[tool.poetry]",
      'name = "poetry-demo"',
      'version = "0.1.0"',
      'description = "Test"',
      'authors = ["John Doe"]',
      "",
      "[tool.poetry.dependencies]",
      'python = "^3.7"',
      'requests = "^2.22.0"',
      'foo = "<6.6.6"',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "requests", type: "ProjectName" }, [8, 0, 8, 20]],
      [{ name: "foo", type: "ProjectName" }, [9, 0, 9, 14]],
    ]);
    expect(result.detailedFormat).toBe("poetry");
  });

  it("should extract requirements from groups", () => {
    const document = makeTextDocumentLike([
      "[tool.poetry]",
      'name = "poetry-demo"',
      'version = "0.1.0"',
      'description = "Test"',
      'authors = ["John Doe"]',
      "",
      "[tool.poetry.group.turbo.dependencies]",
      'baz = ">6.6.6"',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "baz", type: "ProjectName" }, [7, 0, 7, 14]],
    ]);
  });

  it("should extract legacy dev requirements", () => {
    const document = makeTextDocumentLike([
      "[tool.poetry]",
      'name = "poetry-demo"',
      'version = "0.1.0"',
      'description = "Test"',
      'authors = ["John Doe"]',
      "",
      "[tool.poetry.dev-dependencies]",
      'bar = ">6.6.6"',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "bar", type: "ProjectName" }, [7, 0, 7, 14]],
    ]);
  });

  it("should extract complex requirements", () => {
    const document = makeTextDocumentLike([
      "[tool.poetry]",
      'name = "poetry-demo"',
      'version = "0.1.0"',
      'description = "Test"',
      'authors = ["John Doe"]',
      "",
      "[tool.poetry.dependencies]",
      `black = {version = "19.10b0", allow-prereleases = true, python = "^3.7", markers = "platform_python_implementation == 'CPython'"}`,
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "black", type: "ProjectName" }, [7, 0, 7, 129]],
    ]);
  });

  it("should extract expanded requirements", () => {
    const document = makeTextDocumentLike([
      "[tool.poetry]",
      'name = "poetry-demo"',
      'version = "0.1.0"',
      'description = "Test"',
      'authors = ["John Doe"]',
      "",
      "[tool.poetry.group.dev.dependencies.black]",
      'version = "19.10b0"',
      "allow-prereleases = true",
      'python = "^3.7"',
      `markers = "platform_python_implementation == 'CPython'"`,
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "black", type: "ProjectName" }, [6, 0, 10, 55]],
    ]);
  });

  it("should extract source", () => {
    const document = makeTextDocumentLike([
      "[[tool.poetry.source]]",
      'name = "private"',
      'url = "http://example.com"',
    ]);

    const result = parseProject(document);

    expect(result.source).toEqual("http://example.com");
  });
});

describe("parseProject with PEP 631", () => {
  it("should extract basic requirements", () => {
    const document = makeTextDocumentLike([
      "[project]",
      "dependencies = [",
      '  "httpx",',
      '  "gidgethub[httpx]>4.0.0",',
      "  \"django>2.1; os_name != 'nt'\",",
      "  \"django>2.0; os_name == 'nt'\"",
      "]",
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "httpx", type: "ProjectName" }, [2, 2, 2, 9]],
      [
        { name: "gidgethub", specifier: ">4.0.0", type: "ProjectName" },
        [3, 2, 3, 26],
      ],
      [
        { name: "django", specifier: ">2.1", type: "ProjectName" },
        [4, 2, 4, 31],
      ],
      [
        { name: "django", specifier: ">2.0", type: "ProjectName" },
        [5, 2, 5, 31],
      ],
    ]);
  });

  it("should extract requirements from extras", () => {
    const document = makeTextDocumentLike([
      "[project]",
      "dependencies = [",
      '  "httpx",',
      "]",
      "[project.optional-dependencies]",
      'cli = ["gidgethub[httpx]>4.0.0"]',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "httpx", type: "ProjectName" }, [2, 2, 2, 9]],
      [
        { name: "gidgethub", specifier: ">4.0.0", type: "ProjectName" },
        [5, 7, 5, 31],
      ],
    ]);
  });
});

describe("parseProject with uv", () => {
  it("should extract requirements from constraint-dependencies", () => {
    const document = makeTextDocumentLike([
      "[tool.uv]",
      'constraint-dependencies = ["grpcio<1.65"]',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "grpcio", specifier: "<1.65", type: "ProjectName" },
        [1, 27, 1, 40],
      ],
    ]);
    expect(result.detailedFormat).toBe("uv");
  });

  it("should extract requirements from dev-dependencies", () => {
    const document = makeTextDocumentLike([
      "[tool.uv]",
      'dev-dependencies = ["ruff==0.5.0"]',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "ruff", specifier: "==0.5.0", type: "ProjectName" },
        [1, 20, 1, 33],
      ],
    ]);
  });

  it("should extract requirements from override-dependencies", () => {
    const document = makeTextDocumentLike([
      "[tool.uv]",
      'override-dependencies = ["werkzeug==2.3.0"]',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "werkzeug", specifier: "==2.3.0", type: "ProjectName" },
        [1, 25, 1, 42],
      ],
    ]);
  });

  it("should extract source", () => {
    const document = makeTextDocumentLike([
      "[tool.uv]",
      "index-url = 'https://example.com'",
    ]);

    const result = parseProject(document);

    expect(result.source).toEqual("https://example.com");
  });
});

describe("parseProject with PEP 735", () => {
  it("should extract requirements from dependency-groups", () => {
    const document = makeTextDocumentLike([
      "[dependency-groups]",
      'test = ["pytest>7", "coverage"]',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "pytest", specifier: ">7", type: "ProjectName" }, [1, 8, 1, 18]],
      [{ name: "coverage", type: "ProjectName" }, [1, 20, 1, 30]],
    ]);
  });

  it("should extract requirements from dependency-groups, ignoring include-group", () => {
    const document = makeTextDocumentLike([
      "[dependency-groups]",
      'coverage = ["coverage[toml]"]',
      'test = ["pytest>7", {include-group = "coverage"}]',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      // FIXME: This should be included
      // [{ name: "coverage", type: "ProjectName" }, [1, 12, 1, 28]],
      [{ name: "pytest", specifier: ">7", type: "ProjectName" }, [2, 8, 2, 18]],
    ]);
  });
});

describe("parseProject with Pixi", () => {
  it("should extract basic requirements", () => {
    const document = makeTextDocumentLike([
      "[tool.pixi]",
      'name = "pixi-demo"',
      'version = "0.1.0"',
      'description = "Test"',
      'authors = ["John Doe"]',
      "",
      "[tool.pixi.dependencies]",
      'requests = "^2.22.0"',
      'foo = "<6.6.6"',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "requests", type: "ProjectName" }, [7, 0, 7, 20]],
      [{ name: "foo", type: "ProjectName" }, [8, 0, 8, 14]],
    ]);
    expect(result.detailedFormat).toBe("pixi");
  });

  it("should extract requirements from feature", () => {
    const document = makeTextDocumentLike([
      "[tool.pixi]",
      'name = "pixi-demo"',
      'version = "0.1.0"',
      'description = "Test"',
      'authors = ["John Doe"]',
      "",
      "[tool.pixi.feature.test.dependencies]",
      'baz = ">6.6.6"',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [{ name: "baz", type: "ProjectName" }, [7, 0, 7, 14]],
    ]);
  });
});

describe("parseProject with git versioning", () => {
  // TODO: consider how to deal with git versioning well...
  it("should NOT extract requirements", () => {
    const document = makeTextDocumentLike([
      "[project]",
      "dependencies = [",
      '  "django ==5.1.6",',
      ' "django-cron @ git+https://github.com/jorenham/django-cron.git@cec7465",',
      ' "django-suit @ git+https://github.com/jorenham/django-suit.git@3d249e7",',
      "]",
    ]);

    const result = parseProject(document);
    // git versioned requirements/dependencies are not recognized
    expect(result.dependencies).toEqual([
      [
        { name: "django", specifier: "==5.1.6", type: "ProjectName" },
        [2, 2, 2, 18],
      ],
    ]);
  });
});
