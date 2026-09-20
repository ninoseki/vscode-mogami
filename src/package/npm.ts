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

  async get(name: string): Promise<PackageType> {
    const data = await this.fetchJson(urlJoin(this.source.toString(), name))
    const parsed = NpmPackageSchema.parse(data)

    const url = (() => {
      if (parsed.homepage) return parsed.homepage

      const repo = parsed.repository
      if (!repo) return undefined
      if (typeof repo === 'string') return undefined
      const repoUrl = repo.url.replace(/^git\+/, '').replace(/\.git$/, '')
      return repoUrl
    })()

    return {
      name: parsed.name,
      version: parsed['dist-tags'].latest || '',
      summary: parsed.description,
      versions: Object.keys(parsed.versions),
      url,
    }
  }

  async select(pkg: PackageType, dependency: DependencyType): Promise<PackageType> {
    const cap = (() => {
      if (this.keepPrereleases(dependency)) return undefined
      if (!pkg.version) return undefined
      if (isPrerelease(pkg.version)) return undefined
      return pkg.version
    })()

    if (!cap) {
      return await super.select(pkg, dependency)
    }

    const versions = pkg.versions.filter((v) => compare(v, cap) <= 0)
    return await super.select({ ...pkg, versions }, dependency)
  }
}
