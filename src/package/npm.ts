import { z } from 'zod'

import { DependencyType, PackageType } from '@/schemas'
import { urlJoin } from '@/utils'
import { compare, isPrerelease } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

const NpmPackageSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  'dist-tags': z.object({ latest: z.string().optional() }).passthrough(),
  versions: z.record(z.string(), z.unknown()),
  homepage: z.string().nullish(),
  repository: z
    .union([z.object({ url: z.string() }), z.string()])
    .optional()
    .catch(undefined),
})

export class NpmClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    super('https://registry.npmjs.org/', privateSource)
  }

  async get(name: string, dependency: DependencyType): Promise<PackageType> {
    const data = await this.fetchJson(urlJoin(this.source.toString(), name))
    const parsed = NpmPackageSchema.parse(data)
    const distTags = parsed['dist-tags']
    const latestTaggedVersion = distTags.latest

    const allVersions = Object.keys(parsed.versions)

    const cap = (() => {
      if (this.keepPrereleases(dependency)) return undefined
      if (!latestTaggedVersion) return undefined
      if (isPrerelease(latestTaggedVersion)) return undefined
      return latestTaggedVersion
    })()
    const versions = cap ? allVersions.filter((v) => compare(v, cap) <= 0) : allVersions

    const url = (() => {
      if (parsed.homepage) return parsed.homepage

      const repo = parsed.repository
      if (!repo) return undefined
      if (typeof repo === 'string') return undefined
      const repoUrl = repo.url.replace(/^git\+/, '').replace(/\.git$/, '')
      return repoUrl
    })()

    const version = (() => {
      if (cap) return cap
      const newest = versions[versions.length - 1]
      if (newest) return newest
      return ''
    })()

    const pkg: PackageType = {
      name: parsed.name,
      version,
      summary: parsed.description ?? undefined,
      versions,
      url,
    }

    return this.normalizePackage(pkg, dependency)
  }
}
