import type { TextDocumentLikeType } from "@/schemas";

import { parseProject } from "./requirements";

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
  it("should extract exact equal requirements with comment", () => {
    const document = makeTextDocumentLike([
      "# Comment",
      "package1==1.0.0",
      "package2 == 2.0.0",
      "package3==3.0.0",
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "package1", specifier: "==1.0.0", type: "ProjectName" },
        [1, 0, 1, 13],
      ],
      [
        { name: "package2", specifier: "== 2.0.0", type: "ProjectName" },
        [2, 0, 2, 15],
      ],
      [
        { name: "package3", specifier: "==3.0.0", type: "ProjectName" },
        [3, 0, 3, 13],
      ],
    ]);
  });

  it("should extract source", () => {
    const document = makeTextDocumentLike(["--index-url https://example.com/"]);

    const result = parseProject(document);

    expect(result.source).toEqual("https://example.com/");
  });
});
