import { findNodeAtLocation, type Node as JsonNode, parseTree, type Segment } from 'jsonc-parser'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

const nonRegistryPrefixes = [
  'workspace:',
  'catalog:',
  'npm:',
  'file:',
  'link:',
  'portal:',
  'patch:',
  'git+',
  'git://',
  'github:',
  'bitbucket:',
  'http://',
  'https://',
]

function isRegistrySpecifier(specifier: string): boolean {
  return !nonRegistryPrefixes.some((prefix) => specifier.startsWith(prefix))
}

const FLAT_DEP_PATHS: Segment[][] = [
  ['dependencies'],
  ['devDependencies'],
  ['peerDependencies'],
  ['optionalDependencies'],
  ['jspm', 'dependencies'],
  ['jspm', 'devDependencies'],
  ['jspm', 'peerDependencies'],
  ['jspm', 'optionalDependencies'],
]

const OVERRIDE_ROOTS: Segment[][] = [['overrides'], ['pnpm', 'overrides']]

interface DepEntry {
  name: string
  specifier: string
  range: RawRangeType
}

class LineMap {
  private readonly lineStarts: number[]

  constructor(text: string) {
    const starts = [0]
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 10 /* \n */) {
        starts.push(i + 1)
      }
    }
    this.lineStarts = starts
  }

  positionAt(offset: number): [number, number] {
    let lo = 0
    let hi = this.lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1
      if (this.lineStarts[mid] <= offset) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }
    return [lo, offset - this.lineStarts[lo]]
  }
}

function nodeRange(node: JsonNode, lines: LineMap): RawRangeType {
  const [sl, sc] = lines.positionAt(node.offset)
  const [el, ec] = lines.positionAt(node.offset + node.length)
  return [sl, sc, el, ec]
}

function collectFlatDeps(section: JsonNode, lines: LineMap): DepEntry[] {
  if (section.type !== 'object' || !section.children) return []
  const out: DepEntry[] = []
  for (const prop of section.children) {
    if (prop.type !== 'property' || !prop.children || prop.children.length < 2) continue
    const [keyNode, valueNode] = prop.children
    if (keyNode.type !== 'string' || valueNode.type !== 'string') continue
    out.push({
      name: keyNode.value as string,
      specifier: valueNode.value as string,
      range: nodeRange(prop, lines),
    })
  }
  return out
}

function collectOverrides(section: JsonNode, lines: LineMap): DepEntry[] {
  if (section.type !== 'object' || !section.children) return []
  const out: DepEntry[] = []
  for (const prop of section.children) {
    if (prop.type !== 'property' || !prop.children || prop.children.length < 2) continue
    const [keyNode, valueNode] = prop.children
    if (keyNode.type !== 'string') continue
    if (valueNode.type === 'string') {
      out.push({
        name: keyNode.value as string,
        specifier: valueNode.value as string,
        range: nodeRange(prop, lines),
      })
    } else if (valueNode.type === 'object') {
      out.push(...collectOverrides(valueNode, lines))
    }
  }
  return out
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const text = document.getText()
  const root = parseTree(text)
  if (!root || root.type !== 'object') {
    return { format: 'npm', dependencies: [] }
  }

  const lines = new LineMap(text)
  const seen = new Set<string>()
  const dependencies: [DependencyType, RawRangeType][] = []

  const add = (entries: DepEntry[]) => {
    for (const entry of entries) {
      if (!isRegistrySpecifier(entry.specifier)) continue
      if (seen.has(entry.name)) continue
      seen.add(entry.name)
      dependencies.push([{ name: entry.name, specifier: entry.specifier }, entry.range])
    }
  }

  for (const path of FLAT_DEP_PATHS) {
    const node = findNodeAtLocation(root, path)
    if (node) add(collectFlatDeps(node, lines))
  }

  for (const path of OVERRIDE_ROOTS) {
    const node = findNodeAtLocation(root, path)
    if (node) add(collectOverrides(node, lines))
  }

  const registryNode = findNodeAtLocation(root, ['publishConfig', 'registry'])
  const source =
    registryNode?.type === 'string' && typeof registryNode.value === 'string'
      ? registryNode.value
      : undefined

  return { format: 'npm', dependencies, source }
}
