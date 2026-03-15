import type { TextDocumentLikeType } from '@/schemas'

import { parseProject } from './npm'

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

describe('parseProject', () => {
  it('should extract dependencies and devDependencies', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "dependencies": {',
      '    "react": "^18.0.0",',
      '    "lodash": "~4.17.0"',
      '  },',
      '  "devDependencies": {',
      '    "typescript": "^5.0.0"',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.format).toBe('npm')
    expect(result.dependencies).toHaveLength(3)

    const [react] = result.dependencies[0]
    expect(react.name).toBe('react')
    expect(react.specifier).toBe('^18.0.0')

    const [lodash] = result.dependencies[1]
    expect(lodash.name).toBe('lodash')
    expect(lodash.specifier).toBe('~4.17.0')

    const [typescript] = result.dependencies[2]
    expect(typescript.name).toBe('typescript')
    expect(typescript.specifier).toBe('^5.0.0')
  })

  it('should skip non-registry specifiers', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "dependencies": {',
      '    "react": "^18.0.0",',
      '    "local-pkg": "file:../local-pkg",',
      '    "ws-pkg": "workspace:*",',
      '    "catalog-pkg": "catalog:",',
      '    "git-pkg": "git+https://github.com/foo/bar.git"',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0].name).toBe('react')
  })

  it('should handle scoped packages', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "dependencies": {',
      '    "@scope/package": "^1.0.0"',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0].name).toBe('@scope/package')
    expect(result.dependencies[0][0].specifier).toBe('^1.0.0')
  })

  it('should extract overrides (flat and nested)', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "overrides": {',
      '    "semver": "5.3.0",',
      '    "somepackage": {',
      '      "typescript": "4.9.5"',
      '    }',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(2)
    const names = result.dependencies.map(([d]) => d.name)
    expect(names).toContain('semver')
    expect(names).toContain('typescript')
  })

  it('should extract pnpm.overrides', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "pnpm": {',
      '    "overrides": {',
      '      "typescript": "4.9.5"',
      '    }',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0].name).toBe('typescript')
    expect(result.dependencies[0][0].specifier).toBe('4.9.5')
  })

  it('should extract jspm dependencies', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "jspm": {',
      '    "dependencies": {',
      '      "bluebird": "^3.4.6"',
      '    }',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0].name).toBe('bluebird')
    expect(result.dependencies[0][0].specifier).toBe('^3.4.6')
  })

  it('should extract source from publishConfig.registry', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "dependencies": {',
      '    "react": "^18.0.0"',
      '  },',
      '  "publishConfig": {',
      '    "registry": "https://my-registry.example.com/"',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.source).toBe('https://my-registry.example.com/')
  })

  it('should return empty dependencies for invalid JSON', () => {
    const document = makeTextDocumentLike(['not valid json'])
    const result = parseProject(document)
    expect(result.dependencies).toHaveLength(0)
  })

  it('should record correct line positions', () => {
    const document = makeTextDocumentLike([
      '{',
      '  "dependencies": {',
      '    "react": "^18.0.0"',
      '  }',
      '}',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    const [, range] = result.dependencies[0]
    expect(range[0]).toBe(2) // line index of the react dependency
  })
})
