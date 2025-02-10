import type { TextDocumentLikeType } from "@/schemas";

import { parseProject } from "./gemfile";

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
      '  gem "pry", "~> 0.12"',
      '  gem "anyway_config", "0.0.0"',
      '  gem "grape-entity", "0.0.0"',
      `  gem "coveralls", "~> 0.8", require: false`,
      `gem "rails"`,
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        { name: "pry", specifier: "~> 0.12", type: "ProjectName" },
        [0, 0, 0, 20],
      ],
      [
        { name: "anyway_config", specifier: "0.0.0", type: "ProjectName" },
        [1, 0, 1, 28],
      ],
      [
        { name: "grape-entity", specifier: "0.0.0", type: "ProjectName" },
        [2, 0, 2, 27],
      ],
      [
        { name: "coveralls", specifier: "~> 0.8", type: "ProjectName" },
        [3, 0, 3, 41],
      ],
      [{ name: "rails", type: "ProjectName" }, [4, 0, 4, 9]],
    ]);
  });
});
