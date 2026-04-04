import { type AST, parseYAML, traverseNodes } from 'yaml-eslint-parser'

type YAMLMapping = AST.YAMLMapping
type YAMLNode = AST.YAMLNode
type YAMLPair = AST.YAMLPair
type YAMLSequence = AST.YAMLSequence
type Visitor = Parameters<typeof traverseNodes>[1]

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

function findStringValueByKey(mapping: YAMLMapping, keyName: string): string | undefined {
  const pair = mapping.pairs.find((pair) => {
    return pair.key?.type === 'YAMLScalar' && pair.key.value === keyName
  })

  if (pair?.value?.type !== 'YAMLScalar' || typeof pair.value.value !== 'string') {
    return undefined
  }

  return pair.value.value
}

class PreCommitYAMLVisitor implements Visitor {
  public dependencies: [DependencyType, RawRangeType][] = []

  public enterNode(node: YAMLNode): void {
    const pair = node as YAMLPair
    if (pair.type !== 'YAMLPair' || pair.key?.type !== 'YAMLScalar' || pair.key.value !== 'repos') {
      return
    }

    if (pair.value?.type !== 'YAMLSequence') {
      return
    }

    this.parseRepos(pair.value)
  }

  public leaveNode(): void {}

  private parseRepos(repos: YAMLSequence): void {
    for (const entry of repos.entries) {
      if (entry?.type !== 'YAMLMapping') {
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

      this.dependencies.push([
        { name, specifier: rev, type: 'ProjectName' },
        [
          entry.loc.start.line - 1,
          entry.loc.start.column,
          entry.loc.end.line - 1,
          entry.loc.end.column,
        ],
      ])
    }
  }
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const visitor = new PreCommitYAMLVisitor()
  traverseNodes(parseYAML(document.getText()), visitor)

  return {
    dependencies: visitor.dependencies,
    format: 'pre-commit-config',
  }
}
