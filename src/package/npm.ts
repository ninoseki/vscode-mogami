import urlJoin from 'url-join'
import { z } from 'zod'

import { PackageType } from '@/schemas'
import { compare, isPrerelease } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

const NpmPackageSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  'dist-tags': z.object({ latest: z.string().optional() }).passthrough(),
  versions: z.record(z.string(), z.unknown()),
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
    const url = urlJoin(this.source.toString(), name)
    const res = await this.client.get(url, {
      headers: { Accept: 'application/vnd.npm.install-v1+json' },
    })
    const parsed = NpmPackageSchema.parse(res.data)
    const distTags = parsed['dist-tags']
    const latestTaggedVersion = distTags.latest

    let versions = Object.keys(parsed.versions)

    // Cap versions to dist-tags.latest when it's a stable release.
    // This respects the package maintainer's intent: if they haven't promoted
    // a newer version to 'latest', we shouldn't suggest it as an upgrade.
    if (latestTaggedVersion && !isPrerelease(latestTaggedVersion)) {
      versions = versions.filter((v) => compare(v, latestTaggedVersion) <= 0)
    }

    const url_ = (() => {
      const repo = parsed.repository
      if (!repo) return undefined
      if (typeof repo === 'string') return undefined
      const repoUrl = repo.url.replace(/^git\+/, '').replace(/\.git$/, '')
      return repoUrl
    })()

    const pkg: PackageType = {
      name: parsed.name,
      version: latestTaggedVersion ?? versions[versions.length - 1] ?? '',
      summary: parsed.description ?? undefined,
      versions,
      url: url_,
    }

    return this.normalizePackage(pkg)
  }
}
