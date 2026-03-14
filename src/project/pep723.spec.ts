import { describe, expect, it } from 'vitest'

import { TextDocumentLikeType } from '@/schemas'

import { parseMetadataBlock, parseProject } from './pep723'

function makeTextDocumentLike(lines: string[]): TextDocumentLikeType {
  return {
    getText: vi.fn(() => lines.join('\n')),
    lineAt: vi.fn((line) => ({
      text: lines[line],
      range: {
        start: { line, character: 0 },
        end: { line, character: lines[line].length - 2 },
      },
    })),
    lineCount: lines.length,
  }
}

describe('parseMetadataBlock', () => {
  it('should extract basic metadata with requires-python and dependencies', () => {
    const text = `#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "requests<3",
#   "rich",
# ]
# ///

import requests
print("Hello World")`

    const parsed = parseMetadataBlock(text)

    expect(parsed).toBeDefined()
    expect(parsed!.raw).toBe(` requires-python = ">=3.11"
 dependencies = [
   "requests<3",
   "rich",
 ]`)
    expect(parsed!.startLine).toBe(1)
    expect(parsed!.endLine).toBe(7)
  })
})

describe('parseProject', () => {
  it('should extract basic dependencies', () => {
    const document = makeTextDocumentLike([
      '# /// script',
      '# requires-python = ">=3.11"',
      '# dependencies = [',
      '#   "requests<3",',
      '#   "rich",',
      '# ]',
      '# ///',
      '',
      'import requests',
      'print("Hello World")',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toEqual([
      [{ name: 'requests', specifier: '<3', type: 'ProjectName' }, [3, 4, 3, 16]],
      [{ name: 'rich', specifier: undefined, type: 'ProjectName' }, [4, 4, 4, 10]],
    ])
  })
})
