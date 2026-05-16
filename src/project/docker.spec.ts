import type { RangeLikeType, TextDocumentLikeType } from '@/schemas'

import { parseProject } from './docker'

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

describe('parseProject', () => {
  it('extracts a simple FROM with tag', () => {
    const document = makeTextDocumentLike(['FROM node:18-alpine'])

    const result = parseProject(document)

    expect(result.format).toBe('dockerfile')
    expect(result.dependencies).toEqual([
      [{ name: 'node', specifier: '18-alpine', type: 'ProjectName' }, [0, 5, 0, 19]],
    ])
  })

  it('extracts multiple FROMs across multi-stage builds', () => {
    const document = makeTextDocumentLike([
      'FROM node:10.9.2-alpine AS BUILD',
      '',
      'FROM node:10.9.3-alpine',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toEqual([
      [{ name: 'node', specifier: '10.9.2-alpine', type: 'ProjectName' }, [0, 5, 0, 23]],
      [{ name: 'node', specifier: '10.9.3-alpine', type: 'ProjectName' }, [2, 5, 2, 23]],
    ])
  })

  it('handles --platform flag', () => {
    const document = makeTextDocumentLike([
      'FROM --platform=$BUILDPLATFORM node:18-alpine AS BUILD',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0]).toEqual({
      name: 'node',
      specifier: '18-alpine',
      type: 'ProjectName',
    })
  })

  it('captures digest as a specifier', () => {
    const document = makeTextDocumentLike([
      'FROM ubuntu@sha256:18305429afa14ea462f810146ba44d4363ae76e4c8dfc38288cf73aa07485005',
    ])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0]).toEqual({
      name: 'ubuntu',
      specifier: 'sha256:18305429afa14ea462f810146ba44d4363ae76e4c8dfc38288cf73aa07485005',
      type: 'ProjectName',
    })
  })

  it('prefixes custom registries onto the image name', () => {
    const document = makeTextDocumentLike(['FROM mcr.microsoft.com/dotnet/sdk:8.0'])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0]).toEqual({
      name: 'mcr.microsoft.com/dotnet/sdk',
      specifier: '8.0',
      type: 'ProjectName',
    })
  })

  it('skips FROMs that reference a previous build stage', () => {
    const document = makeTextDocumentLike(['FROM node:18 AS builder', 'FROM builder AS final'])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0][0]).toEqual({
      name: 'node',
      specifier: '18',
      type: 'ProjectName',
    })
  })

  it('skips bare images without a tag or digest', () => {
    const document = makeTextDocumentLike(['FROM scratch', 'FROM ruby'])

    const result = parseProject(document)

    expect(result.dependencies).toHaveLength(0)
  })
})
