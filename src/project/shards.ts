import { isMap, isScalar, LineCounter, parseDocument, type YAMLMap } from 'yaml'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

function findStringValueByKey(map: YAMLMap, keyName: string): string | undefined {
  for (const item of map.items) {
    if (isScalar(item.key) && item.key.value === keyName && isScalar(item.value)) {
      const value = item.value.value
      if (typeof value === 'string') {
        return value
      }
    }
  }
  return undefined
}

function trimEndOffset(source: string, offset: number): number {
  let end = offset
  while (end > 0 && /\s/.test(source[end - 1])) {
    end--
  }
  return end
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const source = document.getText()
  const lineCounter = new LineCounter()
  const doc = parseDocument(source, { lineCounter })
  const dependencies: [DependencyType, RawRangeType][] = []

  if (!isMap(doc.contents)) {
    return { dependencies, format: 'shards' }
  }

  for (const topPair of doc.contents.items) {
    if (!isScalar(topPair.key)) {
      continue
    }
    const topKey = topPair.key.value
    if (topKey !== 'dependencies' && topKey !== 'development_dependencies') {
      continue
    }
    if (!isMap(topPair.value)) {
      continue
    }

    for (const depPair of topPair.value.items) {
      if (!isScalar(depPair.key) || !depPair.key.range) {
        continue
      }
      if (!isMap(depPair.value) || !depPair.value.range) {
        continue
      }

      const name = findStringValueByKey(depPair.value, 'github')
      const version = findStringValueByKey(depPair.value, 'version')
      if (!name || !version) {
        continue
      }

      const start = lineCounter.linePos(depPair.key.range[0])
      const end = lineCounter.linePos(trimEndOffset(source, depPair.value.range[1]))

      dependencies.push([
        {
          name: name.toString(),
          specifier: version.toString(),
          type: 'ProjectName',
        },
        [start.line - 1, start.col - 1, end.line - 1, end.col - 1],
      ])
    }
  }

  return {
    dependencies,
    format: 'shards',
  }
}
