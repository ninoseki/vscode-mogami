import { getShowPrerelease, getUsePrivateSource } from '@/configuration'
import { PackageClientType, PackageType } from '@/schemas'
import { compare, isPrerelease } from '@/versioning/utils'

import { clearCache as doClearCache } from './cache'
import { cachedFetch } from './fetchCache'

export { HttpError, isHttpError } from '@/httpError'

const DEFAULT_TIMEOUT_MS = 30_000

export abstract class AbstractPackageClient implements PackageClientType {
  private usePrivateSource: boolean
  private showPrerelease: boolean
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

  abstract get(name: string): Promise<PackageType>

  protected normalizePackage(pkg: PackageType) {
    const versions = this.showPrerelease
      ? pkg.versions
      : pkg.versions.filter((v) => !isPrerelease(v))

    if (versions.length === 0) {
      throw new Error('No valid versions found')
    }

    const sortedVersions = versions.sort(compare)
    pkg.version = sortedVersions[sortedVersions.length - 1]
    return pkg
  }

  clearCache() {
    doClearCache()
  }
}
