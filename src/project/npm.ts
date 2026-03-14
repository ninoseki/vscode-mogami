import { z } from 'zod'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

// Specifiers that don't refer to a registry package
const nonRegistryPrefixes = [
  'workspace:',
  'catalog:',
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

/**
 * Parse an `npm:` alias specifier into the real package name and version.
 * e.g. "npm:typescript@^2.3.4"  → { name: "typescript", specifier: "^2.3.4" }
 * e.g. "npm:@scope/pkg@^1.0.0"  → { name: "@scope/pkg", specifier: "^1.0.0" }
 * e.g. "npm:typescript"         → { name: "typescript", specifier: "*" }
 */
function parseNpmAlias(specifier: string): { name: string; specifier: string } | undefined {
  if (!specifier.startsWith('npm:')) return undefined
  const rest = specifier.slice(4)
  // Skip the leading @ for scoped packages when searching for the version separator
  const atIndex = rest.indexOf('@', rest.startsWith('@') ? 1 : 0)
  if (atIndex < 0) {
    return { name: rest, specifier: '*' }
  }
  return { name: rest.slice(0, atIndex), specifier: rest.slice(atIndex + 1) }
}

/**
 * Strip a pnpm/npm override selector from a dependency key.
 * e.g. "typescript@npm:typescript" → "typescript"
 * e.g. "semver@^5.0.0"            → "semver"
 * e.g. "@scope/pkg@^1.0.0"        → "@scope/pkg"
 */
function stripOverrideSelector(name: string): string {
  const atIndex = name.indexOf('@', 1) // skip leading @ for scoped packages
  return atIndex > 0 ? name.slice(0, atIndex) : name
}

interface DepEntry {
  name: string
  specifier: string
  /** Original JSON key used to locate the entry in the file */
  fileKey: string
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
  for (const [rawKey, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result.push({ name: stripOverrideSelector(rawKey), specifier: value, fileKey: rawKey })
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
      result.push({ name, specifier, fileKey: name })
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
      // Resolve npm: aliases → real package name + version specifier
      const alias = parseNpmAlias(entry.specifier)
      const resolvedName = alias ? alias.name : entry.name
      const resolvedSpecifier = alias ? alias.specifier : entry.specifier

      if (!isRegistrySpecifier(resolvedSpecifier)) {
        continue
      }
      if (!allDeps.has(resolvedName)) {
        allDeps.set(resolvedName, {
          name: resolvedName,
          specifier: resolvedSpecifier,
          fileKey: entry.fileKey,
        })
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

  // Build a lookup from fileKey → DepEntry for efficient line scanning
  const byFileKey = new Map<string, DepEntry>()
  for (const entry of allDeps.values()) {
    if (!byFileKey.has(entry.fileKey)) {
      byFileKey.set(entry.fileKey, entry)
    }
  }

  const remaining = new Map(byFileKey)

  for (let line = 0; line < document.lineCount; line++) {
    if (remaining.size === 0) {
      break
    }

    const { text: lineText, range } = document.lineAt(line)

    for (const [fileKey, entry] of remaining) {
      const regexp = new RegExp(`^\\s*"${escapeRegExp(fileKey)}"\\s*:\\s*"([^"]*)"`)
      if (regexp.test(lineText)) {
        remaining.delete(fileKey)
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
