import type { RangeLikeType, TextDocumentLikeType } from '@/schemas'

import { parseProject } from './actions'

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
  it('should extract dependencies', () => {
    const document = makeTextDocumentLike(['uses: actions/checkout@v4'])

    const result = parseProject(document)

    expect(result.dependencies).toEqual([
      [{ name: 'actions/checkout', specifier: 'v4', type: 'ProjectName' }, [0, 0, 0, 25]],
    ])
  })

  it('should extract dependencies from a workflow with jobs and steps', () => {
    const document = makeTextDocumentLike([
      'jobs:',
      '  build:',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v5 # comment',
      '        with:',
      '          node-version: 22',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toEqual([
      [{ name: 'actions/checkout', specifier: 'v4', type: 'ProjectName' }, [3, 8, 3, 33]],
      [{ name: 'actions/setup-node', specifier: 'v5', type: 'ProjectName' }, [4, 8, 4, 35]],
    ])
  })
})
