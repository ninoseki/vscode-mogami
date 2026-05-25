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

function createLatestSuggestion(pkg: PackageType): PackageSuggestion {
  return { title: `🟢 latest ${pkg.version}`, command: '' }
}

function createLatestSatisfiesSuggestion(pkg: PackageType): PackageSuggestion {
  return { title: `🟡 satisfies latest ${pkg.version}`, command: '' }
}

function createSatisfiesSuggestion(satisfiesVersion: string): PackageSuggestion {
  return { title: `🟡 satisfies ${satisfiesVersion}`, command: '' }
}

function createUpdatableSuggestion(pkg: PackageType): PackageSuggestion {
  const title = `↑ latest ${pkg.version}`
  return { title, command: OnUpdateDependencyClickCommand, replaceable: true }
}

function createBumpSuggestion(satisfiesVersion: string): PackageSuggestion {
  return {
    title: `↑ bump ${satisfiesVersion}`,
    command: OnBumpDependencyClickCommand,
    replaceable: true,
  }
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

  const suggestions: PackageSuggestion[] = []
  const pkg = pkgResult.value

  // Prefer the client-resolved version (e.g. SHA → tag) over the raw specifier
  // so we can compare against pkg.version meaningfully.
  const effectiveSpecifier = (() => {
    if (!dependency.specifier) return undefined
    const resolved = pkg.versionByAlias?.[dependency.specifier]
    return resolved || dependency.specifier
  })()

  const checkIsLatest = (): boolean => {
    // Alias equality must compare the raw specifier (e.g. a commit SHA) to pkg.alias
    // never the resolved tag, since one SHA can be tagged multiple ways (e.g. `v4` and `v4.2.0`).
    if (dependency.specifier && pkg.alias === dependency.specifier) {
      return true
    }
    if (effectiveSpecifier) {
      return eq(pkg.version, effectiveSpecifier)
    }
    // consider it's the latest version if no specifier is provided
    return true
  }

  const checkIsAhead = (): boolean => {
    if (dependency.specifier && pkg.alias === dependency.specifier) return false
    if (!effectiveSpecifier) return false
    if (eq(pkg.version, effectiveSpecifier)) return false
    return compare(pkg.version, removeLeading(effectiveSpecifier)) < 0
  }

  const isAhead = checkIsAhead()
  const isLatest = !isAhead && checkIsLatest()
  const isFixedSpecifier: boolean = semver.valid(dependency.specifier) !== null
  const isRangeSpecifier: boolean = validateRange(dependency)
  const satisfiesVersion = maxSatisfying({
    pkg,
    dependency,
    satisfies,
  })
  const isSatisfying: boolean =
    satisfiesVersion !== undefined &&
    (satisfiesVersion === pkg.version || eq(satisfiesVersion, dependency.specifier))

  if (isLatest) {
    suggestions.push(createLatestSuggestion(pkg))
  } else if (isFixedSpecifier) {
    suggestions.push(createFixedSuggestion(dependency))
  } else if (isRangeSpecifier && satisfiesVersion) {
    if (satisfiesVersion === pkg.version) {
      suggestions.push(createLatestSatisfiesSuggestion(pkg))
    } else {
      suggestions.push(createSatisfiesSuggestion(satisfiesVersion))
    }
  }

  if (!isLatest && !isAhead) {
    suggestions.push(createUpdatableSuggestion(pkg))
  }

  if (isRangeSpecifier && satisfiesVersion && !isSatisfying) {
    suggestions.push(createBumpSuggestion(satisfiesVersion))
  }

  return suggestions
}
