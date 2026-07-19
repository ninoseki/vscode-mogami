// forked from https://github.com/Twixes/pypi-assistant/
import type { AST, traverseNodes } from 'toml-eslint-parser'

type TOMLKeyValue = AST.TOMLKeyValue
type TOMLNode = AST.TOMLNode
type TOMLValue = AST.TOMLValue
type Visitor = Parameters<typeof traverseNodes>[1]

import type { DependencyType, RawRangeType } from '@/schemas'

import { parseLineAsDependency } from './requirements'

export class TOMLVisitor implements Visitor {
  public pathStack: (string | number)[] = []
  public dependencies: [DependencyType, RawRangeType][] = []
  public source: string | undefined = undefined
  private uvIndexSource: string | undefined = undefined
  private uvIndexIsExplicit = false

  public enterNode(node: TOMLNode) {
    if (node.type === 'TOMLTable') {
      this.pathStack = node.resolvedKey.slice()
      if (this.isUvIndex()) {
        this.uvIndexSource = undefined
        this.uvIndexIsExplicit = false
      }
      return
    }

    if (node.type === 'TOMLKeyValue') {
      this.pathStack.push(
        ...node.key.keys.map((key) => ('name' in key ? key.name : 'value' in key ? key.value : '')),
      )

      this.potentiallyRegisterUvSourceByIndex(node)
      return
    }

    if (!this.source && node.type === 'TOMLValue') {
      this.potentiallyRegisterUvSourceByIndexUrl(node)
    }
  }

  public leaveNode(node: TOMLNode) {
    if (node.type === 'TOMLKeyValue') {
      this.pathStack.pop()
      return
    }

    if (node.type === 'TOMLTable' && this.isUvIndex()) {
      if (this.uvIndexSource && !this.uvIndexIsExplicit && !this.source) {
        this.source = this.uvIndexSource
      }
      this.uvIndexSource = undefined
      this.uvIndexIsExplicit = false
    }
  }

  public registerElementsAsDependencies(elements: TOMLNode[]): void {
    for (const elem of elements) {
      if (elem.type !== 'TOMLValue' || typeof elem.value !== 'string' || !elem.value) {
        continue // Only non-empty strings can be dependency specifiers
      }

      const requirement = parseLineAsDependency(elem.value)
      if (requirement?.type === undefined) {
        continue
      }

      this.dependencies.push([
        requirement,
        [
          elem.loc.start.line - 1,
          elem.loc.start.column,
          elem.loc.end.line - 1,
          elem.loc.end.column,
        ],
      ])
    }
  }

  private potentiallyRegisterUvSourceByIndex(node: TOMLKeyValue): void {
    // Check for "tool.uv.index.url"

    if (this.isUvIndex()) {
      const key = node.key.keys[0]
      if ('name' in key && key.name === 'url') {
        if (node.value.type === 'TOMLValue' && typeof node.value.value === 'string') {
          this.uvIndexSource = node.value.value
        }
      } else if ('name' in key && key.name === 'explicit') {
        if (node.value.type === 'TOMLValue' && node.value.value === true) {
          this.uvIndexIsExplicit = true
        }
      }
    }
  }

  private isUvIndex(): boolean {
    return (
      this.pathStack[0] === 'tool' && this.pathStack[1] === 'uv' && this.pathStack[2] === 'index'
    )
  }

  private potentiallyRegisterUvSourceByIndexUrl(node: TOMLValue): void {
    // check for "tool.uv.index-url"
    if (this.pathStack[0] === 'tool' && this.pathStack[1] === 'uv') {
      const source: string | undefined = (() => {
        if ((this.pathStack[2] as string) === 'index-url') {
          return node.value.toString()
        }
        return undefined
      })()

      if (source && !this.source) {
        this.source = source
      }
    }
  }
}
