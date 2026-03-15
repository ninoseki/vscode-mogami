// split from codeLensFactory.ts to make them testable
// (using "vscode" package makes it difficult to test with vitest)
import { isAxiosError } from 'axios'
import { Result } from 'neverthrow'
import semver from 'semver'

import { OnBumpDependencyClickCommand, OnUpdateDependencyClickCommand } from '@/constants'
import type { DependencyType, PackageType, SatisfiesFnType, validateRangeFnType } from '@/schemas'
import { eq, maxSatisfying } from '@/versioning/utils'

export interface PackageSuggestion {
  title: string
  command: string
  replaceable?: boolean
}

function createErrorSuggestion(err: unknown): PackageSuggestion {
  const symbol = '🔴'
  const message: string = (() => {
    if (isAxiosError(err)) {
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

  const checkIsLatest = (): boolean => {
    if (dependency.specifier) {
      // check alias equality (if alias is available)
      if (pkg.alias === dependency.specifier) {
        return true
      }

      // check semantic versioning equality
      return eq(pkg.version, dependency.specifier)
    }
    // consider it's the latest version if no specifier is provided
    return true
  }

  const isLatest = checkIsLatest()
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

  if (!isLatest) {
    suggestions.push(createUpdatableSuggestion(pkg))
  }

  if (isRangeSpecifier && satisfiesVersion && !isSatisfying) {
    suggestions.push(createBumpSuggestion(satisfiesVersion))
  }

  return suggestions
}
