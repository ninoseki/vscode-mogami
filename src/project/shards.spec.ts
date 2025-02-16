import type { TextDocumentLikeType } from "@/schemas";

import { parseProject } from "./shards";

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

describe("parseProject", () => {
  it("should extract dependencies", () => {
    const document = makeTextDocumentLike([
      "dependencies:",
      "  foo:",
      "    github: example/foo",
      "    version: 0.0.0",
      "  bar:",
      "    github: example/bar",
      "    version: 0.1.0",
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "example/foo", specifier: "0.0.0", type: "ProjectName" },
        [1, 2, 3, 18],
      ],
      [
        { name: "example/bar", specifier: "0.1.0", type: "ProjectName" },
        [4, 2, 6, 18],
      ],
    ]);
  });

  it("should extract dev dependencies", () => {
    const document = makeTextDocumentLike([
      "development_dependencies:",
      "  foo:",
      "    github: example/foo",
      "    version: 0.0.0",
      "  bar:",
      "    github: example/bar",
      "    version: 0.1.0",
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "example/foo", specifier: "0.0.0", type: "ProjectName" },
        [1, 2, 3, 18],
      ],
      [
        { name: "example/bar", specifier: "0.1.0", type: "ProjectName" },
        [4, 2, 6, 18],
      ],
    ]);
  });
});
