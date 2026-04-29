import { type AST, parseTOML, traverseNodes } from 'toml-eslint-parser'

type TOMLArray = AST.TOMLArray
type TOMLKeyValue = AST.TOMLKeyValue
type TOMLNode = AST.TOMLNode
type TOMLTable = AST.TOMLTable

import type { ProjectType, TextDocumentLikeType } from '@/schemas'

import { TOMLVisitor } from './common'

class PyprojectTOMLVisitor extends TOMLVisitor {
  public detailedFormat?: string = undefined

  public enterNode(node: TOMLNode) {
    super.enterNode(node)

    if (node.type === 'TOMLTable') {
      this.potentiallyRegisterToolDependency(
        node,
        'poetry',
        ['dependencies', 'dev-dependencies'],
        'group',
      )
      this.potentiallyRegisterToolDependency(node, 'pixi', ['dependencies'], 'feature')
      return
    }

    if (node.type === 'TOMLKeyValue') {
      this.potentiallyRegisterToolDependency(
        node,
        'poetry',
        ['dependencies', 'dev-dependencies'],
        'group',
      )
      this.potentiallyRegisterToolDependency(node, 'pixi', ['dependencies'], 'feature')
      if (!this.source) {
        this.potentiallyRegisterPoetrySource(node)
      }
      return
    }

    if (node.type === 'TOMLArray') {
      this.potentiallyRegisterPep631Dependency(node)
      this.potentiallyRegisterPep735Dependency(node)
      this.potentiallyRegisterUvDependency(node)
      this.potentiallyRegisterPep518Dependency(node)
    }
  }

  private potentiallyRegisterPep518Dependency(node: TOMLArray): void {
    const isUnderBuildSystemRequires =
      this.pathStack.length === 2 &&
      this.pathStack[0] === 'build-system' &&
      this.pathStack[1] === 'requires'
    if (!isUnderBuildSystemRequires) {
      return
    }
    this.registerElementsAsDependencies(node.elements)
  }

  private potentiallyRegisterToolDependency(
    node: TOMLTable | TOMLKeyValue,
    tool: string,
    basicDepKeys: string[],
    groupKey: string,
  ): void {
    if (this.pathStack[0] !== 'tool' || this.pathStack[1] !== tool) return

    let projectName: string | undefined
    if (
      basicDepKeys.includes(this.pathStack[2] as string) &&
      this.pathStack.length === 4 &&
      typeof this.pathStack[3] === 'string'
    ) {
      // Basic dependencies and legacy dev dependencies
      projectName = this.pathStack[3]
    } else if (
      this.pathStack[2] === groupKey &&
      this.pathStack[4] === 'dependencies' &&
      this.pathStack.length === 6 &&
      typeof this.pathStack[5] === 'string'
    ) {
      // Dependency group
      projectName = this.pathStack[5]
    }

    if (projectName) {
      this.detailedFormat ??= tool
      this.dependencies.push([
        { name: projectName, type: 'ProjectName' },
        [
          node.loc.start.line - 1,
          node.loc.start.column,
          node.loc.end.line - 1,
          node.loc.end.column,
        ],
      ])
    }
  }

  private potentiallyRegisterPep631Dependency(node: TOMLArray): void {
    const isUnderRequiredDependencies =
      this.pathStack.length === 2 &&
      this.pathStack[0] === 'project' &&
      this.pathStack[1] === 'dependencies'
    const isUnderOptionalDependencies =
      this.pathStack.length === 3 &&
      this.pathStack[0] === 'project' &&
      this.pathStack[1] === 'optional-dependencies' // pathStack[2] is arbitrary here - it's the name of the extra
    if (!isUnderRequiredDependencies && !isUnderOptionalDependencies) {
      return
    }
    this.registerElementsAsDependencies(node.elements)
  }

  private potentiallyRegisterUvDependency(node: TOMLArray): void {
    const uvDeps = ['constraint-dependencies', 'dev-dependencies', 'override-dependencies']
    if (
      this.pathStack.length !== 3 ||
      this.pathStack[0] !== 'tool' ||
      this.pathStack[1] !== 'uv' ||
      !uvDeps.includes(this.pathStack[2] as string)
    ) {
      return
    }

    this.detailedFormat ??= 'uv'
    this.registerElementsAsDependencies(node.elements)
  }

  private potentiallyRegisterPep735Dependency(node: TOMLArray): void {
    const isUnderDependencyGroups =
      this.pathStack.length === 2 && this.pathStack[0] === 'dependency-groups' // pathStack[1] is arbitrary here - it's the name of the group
    if (!isUnderDependencyGroups) {
      return
    }
    this.registerElementsAsDependencies(node.elements)
  }

  private potentiallyRegisterPoetrySource(node: TOMLKeyValue): void {
    if (this.pathStack[0] === 'tool' && this.pathStack[1] === 'poetry') {
      const source: string | undefined = (() => {
        if ((this.pathStack[2] as string) === 'source' && (this.pathStack[4] as string) === 'url') {
          return 'value' in node.value ? node.value.value.toString() : undefined
        }
        return undefined
      })()

      if (source && !this.source) {
        this.source = source
      }
    }
  }
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const visitor = new PyprojectTOMLVisitor()
  traverseNodes(parseTOML(document.getText()), visitor)

  // reject "python" dependency
  const dependencies = visitor.dependencies.filter((item) => {
    const dependency = item[0]
    return dependency.name !== 'python'
  })

  return {
    dependencies: dependencies,
    format: 'pyproject',
    source: visitor.source,
    detailedFormat: visitor.detailedFormat,
  }
}
