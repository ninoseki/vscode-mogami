import * as vscode from 'vscode'
import { z } from 'zod'

export const ProjectFormatSchema = z.enum([
  'gemfile',
  'gemspec',
  'github-actions-workflow',
  'npm',
  'pep723',
  'pre-commit-config',
  'pip-requirements',
  'pyproject',
  'shards',
])

export const PackageSchema = z.object({
  name: z.string(),
  version: z.string().describe('The latest version of the package'),
  alias: z.string().optional().describe('An alias of the the latest version'),
  versions: z.array(z.string()),
  summary: z.string().nullish(),
  url: z.string().optional(),
  format: ProjectFormatSchema.optional(),
})

export type PackageType = z.infer<typeof PackageSchema>

export interface DependencyType {
  name: string
  type?: string
  specifier?: string
  // Gem can have multiple requirements like:
  // "progressbar", ">= 1.9.0", "< 2.0"
  specifierRequirements?: string[]
}

export type RawRangeType = [
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
]

export interface PositionLikeType {
  line: number
  character: number
}

export interface RangeLikeType {
  start: PositionLikeType
  end: PositionLikeType
}
export interface TextDocumentLikeType {
  lineCount: number
  lineAt(line: number): { text: string; range: RangeLikeType }
  getText(range?: RangeLikeType | RawRangeType): string
}

export type ProjectFormatType = z.infer<typeof ProjectFormatSchema>

export interface ProjectType {
  format: ProjectFormatType
  dependencies: [DependencyType, RawRangeType][]
  source?: string
  detailedFormat?: string
}

export interface CodeLensType {
  codeLens: vscode.CodeLens
  documentUrl: vscode.Uri
  pkg: PackageType
  deps: DependencyType
}

export type SatisfiesFnType = (version: string, dependency: DependencyType) => boolean

export type validateRangeFnType = (dependency: DependencyType) => boolean

export interface PackageClientType {
  get: (name: string) => Promise<PackageType>
  clearCache: () => void
}
