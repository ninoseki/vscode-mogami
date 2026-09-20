import { getShowPrerelease, getUsePrivateSource } from '@/configuration'
import { DependencyType, PackageClientType, PackageType } from '@/schemas'
import { compare, isPrerelease, tracksPrerelease } from '@/versioning/utils'

import { clearCache as doClearCache } from './cache'
import { cachedFetch } from './fetchCache'

export { HttpError, isHttpError } from '@/httpError'

const DEFAULT_TIMEOUT_MS = 30_000

export abstract class AbstractPackageClient implements PackageClientType {
  private usePrivateSource: boolean
  protected showPrerelease: boolean
  private primarySource: URL
  private privateSource?: URL

  constructor(primarySource: string, privateSource?: string) {
    this.primarySource = new URL(primarySource)
    if (privateSource) {
      this.privateSource = new URL(privateSource)
    }

    this.usePrivateSource = getUsePrivateSource()
    this.showPrerelease = getShowPrerelease()
  }

  get source(): URL {
    if (this.usePrivateSource && this.privateSource) {
      return this.privateSource
    }
    return this.primarySource
  }

  protected async fetchJson(
    url: string,
    options: { headers?: Record<string, string> } = {},
  ): Promise<unknown> {
    return cachedFetch(url, {
      headers: options.headers,
      responseType: 'json',
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  }

  protected async fetchText(url: string): Promise<string> {
    return cachedFetch(url, {
      responseType: 'text',
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    }) as Promise<string>
  }

  abstract get(name: string, dependency: DependencyType): Promise<PackageType>

  protected keepPrereleases(dependency: DependencyType): boolean {
    if (this.showPrerelease) {
      return true
    }
    return tracksPrerelease(dependency)
  }

  protected normalizePackage(pkg: PackageType, dependency: DependencyType): PackageType {
    const filtered = this.keepPrereleases(dependency)
      ? pkg.versions
      : pkg.versions.filter((v) => !isPrerelease(v))

    const prereleaseOnly = filtered.length === 0 && pkg.versions.length > 0
    const effective = prereleaseOnly ? pkg.versions : filtered

    if (effective.length === 0) {
      throw new Error('No versions found')
    }

    const versions = effective.slice().sort(compare)
    return { ...pkg, versions, prereleaseOnly, version: versions[versions.length - 1] }
  }

  clearCache() {
    doClearCache()
  }
}
