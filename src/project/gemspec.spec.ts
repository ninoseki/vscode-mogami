import type { TextDocumentLikeType } from "@/schemas";

import { parseProject } from "./gemspec";

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
      '  spec.add_development_dependency "bundler", "~> 2.0"',
      'spec.add_dependency "addressable", "~> 2.8"',
      'spec.add_development_dependency "bundler"',
      'spec.add_development_dependency "bundler", "~> 2.0", "< 3.0"',
    ]);

    const result = parseProject(document);

    expect(result.dependencies).toEqual([
      [
        {
          name: "bundler",
          specifierRequirements: ["~> 2.0"],
          specifier: "~> 2.0",
          type: "ProjectName",
        },
        [0, 0, 0, 51],
      ],
      [
        {
          name: "addressable",
          specifierRequirements: ["~> 2.8"],
          specifier: "~> 2.8",
          type: "ProjectName",
        },
        [1, 0, 1, 41],
      ],
      [
        {
          name: "bundler",
          specifierRequirements: undefined,
          specifier: undefined,
          type: "ProjectName",
        },
        [2, 0, 2, 39],
      ],
      [
        {
          name: "bundler",
          specifierRequirements: ["~> 2.0", "< 3.0"],
          specifier: "< 3.0",
          type: "ProjectName",
        },
        [3, 0, 3, 58],
      ],
    ]);
  });
});
