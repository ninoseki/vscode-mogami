import type { RangeLikeType, TextDocumentLikeType } from '@/schemas'

import { parseImageSpec, parseProject } from './dockerCompose'

function makeTextDocumentLike(lines: string[]): TextDocumentLikeType {
  return {
    getText: vi.fn<() => string>(() => lines.join('\n')),
    lineAt: vi.fn<(line: number) => { text: string; range: RangeLikeType }>((line) => ({
      text: lines[line],
      range: {
        start: { line, character: 0 },
        end: { line, character: lines[line].length },
      },
    })),
    lineCount: lines.length,
  }
}

describe('parseImageSpec', () => {
  it('parses a plain image:tag', () => {
    expect(parseImageSpec('ubuntu:17.04')).toEqual({
      registry: undefined,
      image: 'ubuntu',
      tag: '17.04',
      digest: undefined,
    })
  })

  it('parses a custom registry', () => {
    expect(parseImageSpec('mcr.microsoft.com/dotnet/sdk:8.0')).toEqual({
      registry: 'mcr.microsoft.com',
      image: 'dotnet/sdk',
      tag: '8.0',
      digest: undefined,
    })
  })

  it('parses a digest', () => {
    const parsed = parseImageSpec(
      'ubuntu@sha256:18305429afa14ea462f810146ba44d4363ae76e4c8dfc38288cf73aa07485005',
    )
    expect(parsed?.digest).toBe('18305429afa14ea462f810146ba44d4363ae76e4c8dfc38288cf73aa07485005')
    expect(parsed?.image).toBe('ubuntu')
    expect(parsed?.tag).toBeUndefined()
  })

  it('resolves env-var defaults', () => {
    expect(parseImageSpec('${UBUNTU_IMAGE:-ubuntu:17.04}')).toEqual({
      registry: undefined,
      image: 'ubuntu',
      tag: '17.04',
      digest: undefined,
    })
  })

  it('returns undefined for env vars with no default', () => {
    expect(parseImageSpec('${UBUNTU_IMAGE}')).toBeUndefined()
  })
})

describe('parseProject', () => {
  it('extracts a single service image', () => {
    const document = makeTextDocumentLike([
      "version: '2'",
      'services:',
      '  hello_world:',
      '    image: ubuntu:17.04',
    ])

    const result = parseProject(document)

    expect(result.format).toBe('docker-compose')
    expect(result.dependencies).toEqual([
      [{ name: 'ubuntu', specifier: '17.04', type: 'ProjectName' }, [3, 11, 3, 23]],
    ])
  })

  it('extracts multiple services', () => {
    const document = makeTextDocumentLike([
      "version: '2'",
      'services:',
      '  os:',
      '    image: ubuntu:17.04',
      '  interpreter:',
      '    image: python:3.6.3',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(2)
    expect(result.dependencies[0][0]).toEqual({
      name: 'ubuntu',
      specifier: '17.04',
      type: 'ProjectName',
    })
    expect(result.dependencies[1][0]).toEqual({
      name: 'python',
      specifier: '3.6.3',
      type: 'ProjectName',
    })
  })

  it('handles quoted image values', () => {
    const document = makeTextDocumentLike([
      'services:',
      '  search:',
      '    image: "elastic/elasticsearch:8.16.4"',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0]).toEqual({
      name: 'elastic/elasticsearch',
      specifier: '8.16.4',
      type: 'ProjectName',
    })
  })

  it('resolves env-var defaults inline', () => {
    const document = makeTextDocumentLike([
      'services:',
      '  app:',
      '    image: ${UBUNTU_IMAGE:-ubuntu:17.04}',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0]).toEqual({
      name: 'ubuntu',
      specifier: '17.04',
      type: 'ProjectName',
    })
  })

  it('skips services with build instead of image', () => {
    const document = makeTextDocumentLike([
      'services:',
      '  app:',
      '    build:',
      '      context: .',
      '  db:',
      '    image: postgres:16',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0].name).toBe('postgres')
  })

  it('captures digest references', () => {
    const document = makeTextDocumentLike([
      'services:',
      '  hello:',
      '    image: ubuntu@sha256:18305429afa14ea462f810146ba44d4363ae76e4c8dfc38288cf73aa07485005',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0]).toEqual({
      name: 'ubuntu',
      specifier: 'sha256:18305429afa14ea462f810146ba44d4363ae76e4c8dfc38288cf73aa07485005',
      type: 'ProjectName',
    })
  })

  it('returns no dependencies when services key is missing', () => {
    const document = makeTextDocumentLike(["version: '2'"])

    const result = parseProject(document)

    expect(result.dependencies).toEqual([])
  })
})
