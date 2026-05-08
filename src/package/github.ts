import z from 'zod'

import { PackageType } from '@/schemas'
import { urlJoin } from '@/utils'
import { coerceUnlessValid, compare, isPrerelease } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

const GitHubTagObjectSchema = z.object({
  sha: z.string(),
})

export const GitHubTagSchema = z.object({
  object: GitHubTagObjectSchema,
})

export const GitHubReleaseSchema = z.object({
  name: z.string(),
})

export type GitHubReleaseType = z.infer<typeof GitHubReleaseSchema>

export const GitHubReleasesSchema = z.array(GitHubReleaseSchema)

export class GitHubClient extends AbstractPackageClient {
  private gitHubPersonalAccessToken: string | undefined = undefined

  constructor(
    privateSource?: string,
    {
      gitHubPersonalAccessToken,
    }: {
      gitHubPersonalAccessToken?: string
    } = {},
  ) {
    super('https://api.github.com', privateSource)
    this.gitHubPersonalAccessToken = gitHubPersonalAccessToken
  }

  async get(name: string): Promise<PackageType> {
    const headers: Record<string, string> = {}
    if (this.gitHubPersonalAccessToken) {
      headers.authorization = `Bearer ${this.gitHubPersonalAccessToken}`
    }

    // GitHub Actions can reference a sub-path within a repository
    // (e.g. `github/codeql-action/init`), but the GitHub API only accepts
    // the `owner/repo` portion.
    const repo = name.split('/').slice(0, 2).join('/')

    const getLatestRelease = async () => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', repo, 'releases'),
        {
          headers,
        },
      )

      const releases = GitHubReleasesSchema.parse(data)
      const filtered = this.showPrerelease
        ? releases
        : releases.filter((release) => {
            const coerced = coerceUnlessValid(release.name)?.toString() ?? release.name
            return !isPrerelease(coerced)
          })
      if (filtered.length === 0) {
        throw new Error('No valid versions found')
      }

      const sorted = filtered.sort((a, b) => compare(a.name, b.name))
      return sorted[sorted.length - 1]
    }

    const getTag = async (tagName: string) => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', repo, 'git', 'refs', 'tags', tagName),
        { headers },
      )
      return GitHubTagSchema.parse(data)
    }

    const latest = await getLatestRelease()
    const tag = await getTag(latest.name)
    const version = latest.name

    return {
      name,
      version: version,
      versions: [version],
      alias: tag.object.sha,
      format: 'github-actions-workflow',
    }
  }
}
