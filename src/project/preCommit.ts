import { isMap, isScalar, isSeq, LineCounter, parseDocument, type YAMLMap } from 'yaml'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

const supportedRepoDomains = new Set(['github.com', 'www.github.com'])

function parseRepoName(raw: string): string | undefined {
  const trimmed = raw.trim()

  if (trimmed === '' || trimmed === 'local' || trimmed === 'meta') {
    return undefined
  }

  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith('git@github.com:')) {
    const withoutPrefix = trimmed.replace('git@github.com:', '')
    const normalized = withoutPrefix.replace(/\.git$/, '')
    if (/^[\w.-]+\/[\w.-]+$/.test(normalized)) {
      return normalized
    }
    return undefined
  }

  try {
    const url = new URL(trimmed)
    if (!supportedRepoDomains.has(url.hostname)) {
      return undefined
    }

    const [owner, repo] = url.pathname.split('/').filter(Boolean)
    if (!owner || !repo) {
      return undefined
    }

    return `${owner}/${repo.replace(/\.git$/, '')}`
  } catch {
    return undefined
  }
}

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
    return { dependencies, format: 'pre-commit-config' }
  }

  for (const topPair of doc.contents.items) {
    if (!isScalar(topPair.key) || topPair.key.value !== 'repos') {
      continue
    }
    if (!isSeq(topPair.value)) {
      continue
    }

    for (const entry of topPair.value.items) {
      if (!isMap(entry) || !entry.range) {
        continue
      }

      const repoRaw = findStringValueByKey(entry, 'repo')
      const rev = findStringValueByKey(entry, 'rev')
      if (!repoRaw || !rev) {
        continue
      }

      const name = parseRepoName(repoRaw)
      if (!name) {
        continue
      }

      const start = lineCounter.linePos(entry.range[0])
      const end = lineCounter.linePos(trimEndOffset(source, entry.range[1]))

      dependencies.push([
        { name, specifier: rev, type: 'ProjectName' },
        [start.line - 1, start.col - 1, end.line - 1, end.col - 1],
      ])
    }
  }

  return { dependencies, format: 'pre-commit-config' }
}
