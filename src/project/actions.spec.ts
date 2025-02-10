import type { TextDocumentLikeType } from "@/schemas";

import { parseProject } from "./actions";

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
    const document = makeTextDocumentLike(["uses: actions/checkout@v4"]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "actions/checkout", specifier: "v4", type: "ProjectName" },
        [0, 0, 0, 23],
      ],
    ]);
  });
});
