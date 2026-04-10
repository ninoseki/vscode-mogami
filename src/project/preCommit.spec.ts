import type { RangeLikeType, TextDocumentLikeType } from '@/schemas'

import { parseProject } from './preCommit'

function makeTextDocumentLike(lines: string[]): TextDocumentLikeType {
  return {
    getText: vi.fn<() => string>(() => lines.join('\n')),
    lineAt: vi.fn<(line: number) => { text: string; range: RangeLikeType }>((line) => ({
      text: lines[line],
      range: {
        start: { line, character: 0 },
        end: { line, character: lines[line].length - 2 },
      },
    })),
    lineCount: lines.length,
  }
}

describe('parseProject', () => {
  it('should extract dependencies from github repos', () => {
    const document = makeTextDocumentLike([
      'repos:',
      '  - repo: https://github.com/pre-commit/pre-commit-hooks',
      '    rev: v5.0.0',
      '    hooks:',
      '      - id: check-yaml',
      '  - repo: psf/black',
      '    rev: 24.10.0',
    ])

    const result = parseProject(document)

    expect(result.format).toBe('pre-commit-config')
    expect(result.dependencies).toHaveLength(2)

    const [firstDep] = result.dependencies[0]
    expect(firstDep.name).toBe('pre-commit/pre-commit-hooks')
    expect(firstDep.specifier).toBe('v5.0.0')

    const [secondDep] = result.dependencies[1]
    expect(secondDep.name).toBe('psf/black')
    expect(secondDep.specifier).toBe('24.10.0')
  })

  it('should ignore local and unsupported repositories', () => {
    const document = makeTextDocumentLike([
      'repos:',
      '  - repo: local',
      '    hooks:',
      '      - id: local-hook',
      '  - repo: https://gitlab.com/owner/repo',
      '    rev: 1.2.3',
      '  - repo: meta',
      '    hooks:',
      '      - id: check-hooks-apply',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(0)
  })
})
