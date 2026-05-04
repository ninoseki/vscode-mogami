import { isMap, isScalar, isSeq, LineCounter, type Node, parseDocument } from 'yaml'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

function normalizeSpecifier(specifier: string): string | undefined {
  const withoutComment = specifier.split('#')[0].trim()
  return withoutComment === '' ? undefined : withoutComment
}

function parseUsesValue(value: string): DependencyType | undefined {
  const atIndex = value.indexOf('@')
  if (atIndex === -1) {
    return undefined
  }

  const name = value.slice(0, atIndex).trim()
  if (!name) {
    return undefined
  }

  const specifier = normalizeSpecifier(value.slice(atIndex + 1))
  return { name, specifier, type: 'ProjectName' }
}

function trimEndOffset(source: string, offset: number): number {
  let end = offset
  while (end > 0 && /\s/.test(source[end - 1])) {
    end--
  }
  return end
}

function visit(
  node: Node | null | undefined,
  source: string,
  lineCounter: LineCounter,
  dependencies: [DependencyType, RawRangeType][],
): void {
  if (!node) {
    return
  }

  if (isMap(node)) {
    for (const pair of node.items) {
      if (
        isScalar(pair.key) &&
        pair.key.value === 'uses' &&
        isScalar(pair.value) &&
        typeof pair.value.value === 'string' &&
        pair.key.range &&
        pair.value.range
      ) {
        const dependency = parseUsesValue(pair.value.value)
        if (dependency) {
          const start = lineCounter.linePos(pair.key.range[0])
          const end = lineCounter.linePos(trimEndOffset(source, pair.value.range[1]))
          dependencies.push([
            dependency,
            [start.line - 1, start.col - 1, end.line - 1, end.col - 1],
          ])
        }
        continue
      }
      visit(pair.value as Node, source, lineCounter, dependencies)
    }
    return
  }

  if (isSeq(node)) {
    for (const item of node.items) {
      visit(item as Node, source, lineCounter, dependencies)
    }
  }
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const source = document.getText()
  const lineCounter = new LineCounter()
  const doc = parseDocument(source, { lineCounter })
  const dependencies: [DependencyType, RawRangeType][] = []

  visit(doc.contents as Node, source, lineCounter, dependencies)

  return {
    dependencies,
    format: 'github-actions-workflow',
  }
}
