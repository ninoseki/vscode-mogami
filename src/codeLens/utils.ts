// split from codeLensFactory.ts to make them testable
// (using "vscode" package makes it difficult to test with vitest)
import { Result } from 'neverthrow'
import semver from 'semver'

import { OnBumpDependencyClickCommand, OnUpdateDependencyClickCommand } from '@/constants'
import { isHttpError } from '@/httpError'
import type { DependencyType, PackageType, SatisfiesFnType, validateRangeFnType } from '@/schemas'
import { compare, eq, maxSatisfying, removeLeading } from '@/versioning/utils'

export interface PackageSuggestion {
  title: string
  command: string
  replaceable?: boolean
}

function createErrorSuggestion(err: unknown): PackageSuggestion {
  const symbol = '🔴'
  const message: string = (() => {
    if (isHttpError(err)) {
      switch (err.response?.status) {
        case 400:
          return `400 bad request`
        case 401:
          return `401 not authorized`
        case 403:
          return `403 forbidden`
        case 404:
          return `package not found`
        case 500:
          return `internal server error`
      }
    }
    if (err instanceof Error) {
      return err.message
    }
    return `something went wrong`
  })()
  return {
    title: `${symbol} ${message}`,
    command: '',
  }
}

function createFixedSuggestion(dependency: DependencyType): PackageSuggestion {
  return { title: `🟡 fixed ${dependency.specifier}`, command: '' }
}

function versionLabel(pkg: PackageType): string {
  if (pkg.prereleaseOnly) {
    return `${pkg.version} (prerelease)`
  }
  return pkg.version
}

function createLatestSuggestion(pkg: PackageType): PackageSuggestion {
  return { title: `🟢 latest ${versionLabel(pkg)}`, command: '' }
}

function createAheadSuggestion(): PackageSuggestion {
  return { title: `🟡 ahead of latest`, command: '' }
}

function createLatestSatisfiesSuggestion(pkg: PackageType): PackageSuggestion {
  return { title: `🟡 satisfies latest ${versionLabel(pkg)}`, command: '' }
}

function createSatisfiesSuggestion(satisfiesVersion: string): PackageSuggestion {
  return { title: `🟡 satisfies ${satisfiesVersion}`, command: '' }
}

function createYankedSuggestion(yankedVersion: string): PackageSuggestion {
  return { title: `🔴 yanked ${yankedVersion}`, command: '' }
}

function createDeprecatedSuggestion(deprecatedVersion: string): PackageSuggestion {
  return { title: `🔴 deprecated ${deprecatedVersion}`, command: '' }
}

function createUpdatableSuggestion(pkg: PackageType): PackageSuggestion {
  const title = `↑ latest ${versionLabel(pkg)}`
  return { title, command: OnUpdateDependencyClickCommand, replaceable: true }
}

function createDowngradableSuggestion(pkg: PackageType): PackageSuggestion {
  const title = `↓ latest ${versionLabel(pkg)}`
  return { title, command: OnUpdateDependencyClickCommand, replaceable: true }
}

function createBumpSuggestion(satisfiesVersion: string): PackageSuggestion {
  return {
    title: `↑ bump ${satisfiesVersion}`,
    command: OnBumpDependencyClickCommand,
    replaceable: true,
  }
}

interface SuggestionContext {
  pkg: PackageType
  dependency: DependencyType
  isLatest: boolean
  isAhead: boolean
  isFixedSpecifier: boolean
  isRangeSpecifier: boolean
  satisfiesVersion?: string
  yankedVersion?: string
}

function createContext({
  pkg,
  dependency,
  satisfies,
  validateRange,
}: {
  pkg: PackageType
  dependency: DependencyType
  satisfies: SatisfiesFnType
  validateRange: validateRangeFnType
}): SuggestionContext {
  const { specifier } = dependency
  // Alias equality must compare the raw specifier (e.g. a commit SHA) to pkg.alias
  // never the resolved tag, since one SHA can be tagged multiple ways (e.g. `v4` and `v4.2.0`).
  const isAlias = specifier !== undefined && pkg.alias === specifier
  // Prefer the client-resolved version (e.g. SHA → tag) over the raw specifier
  // so we can compare against pkg.version meaningfully.
  const effectiveSpecifier = specifier ? pkg.versionByAlias?.[specifier] || specifier : undefined
  const isEqual = effectiveSpecifier !== undefined && eq(pkg.version, effectiveSpecifier)

  const isAhead =
    !isAlias &&
    effectiveSpecifier !== undefined &&
    !isEqual &&
    compare(pkg.version, removeLeading(effectiveSpecifier)) < 0
  // consider it's the latest version if no specifier is provided
  const isLatest = !isAhead && (isAlias || effectiveSpecifier === undefined || isEqual)

  const satisfiesVersion = maxSatisfying({ pkg, dependency, satisfies })
  // fall back to yanked versions only when no available version satisfies the specifier
  const yankedVersion =
    satisfiesVersion === undefined && pkg.yankedVersions
      ? maxSatisfying({ pkg: { ...pkg, versions: [...pkg.yankedVersions] }, dependency, satisfies })
      : undefined

  return {
    pkg,
    dependency,
    isLatest,
    isAhead,
    isFixedSpecifier: semver.valid(specifier) !== null,
    isRangeSpecifier: validateRange(dependency),
    satisfiesVersion,
    yankedVersion,
  }
}

function createStatusSuggestion(ctx: SuggestionContext): PackageSuggestion | undefined {
  const { pkg, satisfiesVersion } = ctx
  if (ctx.yankedVersion) return createYankedSuggestion(ctx.yankedVersion)
  if (satisfiesVersion && pkg.deprecatedVersions?.includes(satisfiesVersion)) {
    return createDeprecatedSuggestion(satisfiesVersion)
  }
  if (ctx.isLatest) return createLatestSuggestion(pkg)
  if (ctx.isFixedSpecifier) return createFixedSuggestion(ctx.dependency)
  if (ctx.isRangeSpecifier && satisfiesVersion) {
    return satisfiesVersion === pkg.version
      ? createLatestSatisfiesSuggestion(pkg)
      : createSatisfiesSuggestion(satisfiesVersion)
  }
  if (ctx.isAhead) return createAheadSuggestion()
  return undefined
}

function createActionSuggestions(ctx: SuggestionContext): PackageSuggestion[] {
  const { pkg, satisfiesVersion } = ctx
  const isSatisfying =
    satisfiesVersion !== undefined &&
    (satisfiesVersion === pkg.version || eq(satisfiesVersion, ctx.dependency.specifier))

  const update = (() => {
    if (!ctx.isLatest && !ctx.isAhead) return createUpdatableSuggestion(pkg)
    if (ctx.isAhead && !isSatisfying) return createDowngradableSuggestion(pkg)
    return undefined
  })()
  const bump =
    ctx.isRangeSpecifier && satisfiesVersion && !isSatisfying
      ? createBumpSuggestion(satisfiesVersion)
      : undefined

  return [update, bump].filter((i): i is Exclude<typeof i, undefined> => i !== undefined)
}

export function createPackageSuggestions({
  dependency,
  pkgResult,
  satisfies,
  validateRange,
}: {
  dependency: DependencyType
  pkgResult: Result<PackageType, unknown>
  satisfies: SatisfiesFnType
  validateRange: validateRangeFnType
}): PackageSuggestion[] {
  if (pkgResult.isErr()) {
    return [createErrorSuggestion(pkgResult.error)]
  }

  const ctx = createContext({ pkg: pkgResult.value, dependency, satisfies, validateRange })
  return [createStatusSuggestion(ctx), ...createActionSuggestions(ctx)].filter(
    (i): i is Exclude<typeof i, undefined> => i !== undefined,
  )
}
