import { z } from 'zod'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

// Specifiers that don't refer to a registry package
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface DepEntry {
  name: string
  specifier: string
}

// A flat map of package name → version string
const DepsMapSchema = z.record(z.string(), z.string()).optional().catch(undefined)

// Overrides values can be a version string or a nested selector object
type OverridesRecord = { [key: string]: string | OverridesRecord }
const OverridesRecordSchema: z.ZodType<OverridesRecord> = z.lazy(() =>
  z.record(z.string(), z.union([z.string(), OverridesRecordSchema])),
)
const OverridesSchema = OverridesRecordSchema.optional().catch(undefined)

const PackageJsonSchema = z.object({
  dependencies: DepsMapSchema,
  devDependencies: DepsMapSchema,
  peerDependencies: DepsMapSchema,
  optionalDependencies: DepsMapSchema,
  overrides: OverridesSchema,
  pnpm: z.object({ overrides: OverridesSchema }).optional().catch(undefined),
  jspm: z
    .object({
      dependencies: DepsMapSchema,
      devDependencies: DepsMapSchema,
      peerDependencies: DepsMapSchema,
      optionalDependencies: DepsMapSchema,
    })
    .optional()
    .catch(undefined),
  publishConfig: z.object({ registry: z.string().optional() }).optional().catch(undefined),
})

/**
 * Recursively collect DepEntry items from an overrides-style object.
 * Object values (nested selectors) are traversed; only string values are emitted.
 */
function collectOverrides(obj: OverridesRecord): DepEntry[] {
  const result: DepEntry[] = []
  for (const [name, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result.push({ name, specifier: value })
    } else {
      result.push(...collectOverrides(value))
    }
  }
  return result
}

/**
 * Collect DepEntry items from a list of already-parsed dep sections.
 */
function collectDepsMap(sections: (Record<string, string> | undefined | null)[]): DepEntry[] {
  const result: DepEntry[] = []
  for (const section of sections) {
    if (!section) continue
    for (const [name, specifier] of Object.entries(section)) {
      result.push({ name, specifier })
    }
  }
  return result
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const text = document.getText()

  const json: unknown = (() => {
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  })()

  const result = PackageJsonSchema.safeParse(json)
  if (!result.success) {
    return { format: 'npm', dependencies: [] }
  }
  const pkg = result.data

  // Collect all candidate entries; first one for each resolved name wins
  const allDeps = new Map<string, DepEntry>() // keyed by resolved name for dedup

  const addEntries = (entries: DepEntry[]) => {
    for (const entry of entries) {
      if (!isRegistrySpecifier(entry.specifier)) {
        continue
      }
      if (!allDeps.has(entry.name)) {
        allDeps.set(entry.name, entry)
      }
    }
  }

  addEntries(
    collectDepsMap([
      pkg.dependencies,
      pkg.devDependencies,
      pkg.peerDependencies,
      pkg.optionalDependencies,
    ]),
  )

  if (pkg.overrides) {
    addEntries(collectOverrides(pkg.overrides))
  }
  if (pkg.pnpm?.overrides) {
    addEntries(collectOverrides(pkg.pnpm.overrides))
  }

  if (pkg.jspm) {
    addEntries(
      collectDepsMap([
        pkg.jspm.dependencies,
        pkg.jspm.devDependencies,
        pkg.jspm.peerDependencies,
        pkg.jspm.optionalDependencies,
      ]),
    )
  }

  if (allDeps.size === 0) {
    return { format: 'npm', dependencies: [] }
  }

  const dependencies: [DependencyType, RawRangeType][] = []
  const remaining = new Map(allDeps)

  for (let line = 0; line < document.lineCount; line++) {
    if (remaining.size === 0) {
      break
    }

    const { text: lineText, range } = document.lineAt(line)

    for (const [name, entry] of remaining) {
      const regexp = new RegExp(`^\\s*"${escapeRegExp(name)}"\\s*:\\s*"([^"]*)"`)
      if (regexp.test(lineText)) {
        remaining.delete(name)
        dependencies.push([
          { name: entry.name, specifier: entry.specifier },
          [range.start.line, range.start.character, range.end.line, range.end.character],
        ])
        break
      }
    }
  }

  return { format: 'npm', dependencies, source: pkg.publishConfig?.registry }
}
