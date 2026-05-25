import z from 'zod'

import { PackageType } from '@/schemas'
import { urlJoin } from '@/utils'
import { compare } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

export const GitHubCommitSchema = z.object({
  sha: z.string(),
})

export const GitHubReleaseSchema = z.object({
  tag_name: z.string(),
  prerelease: z.boolean(),
})

export type GitHubReleaseType = z.infer<typeof GitHubReleaseSchema>

export const GitHubReleasesSchema = z.array(GitHubReleaseSchema)

export const GitHubTagSchema = z.object({
  name: z.string(),
  commit: z.object({ sha: z.string() }),
})

export const GitHubTagsSchema = z.array(GitHubTagSchema)

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
            return !release.prerelease
          })
      if (filtered.length === 0) {
        throw new Error('No valid versions found')
      }

      const sorted = filtered.sort((a, b) => compare(a.tag_name, b.tag_name))
      return sorted[sorted.length - 1]
    }

    const getTags = async () => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', repo, 'tags') + '?per_page=100',
        { headers },
      )
      return GitHubTagsSchema.parse(data)
    }

    const getCommit = async (tagName: string) => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', repo, 'commits', tagName),
        { headers },
      )
      return GitHubCommitSchema.parse(data)
    }

    const [latest, tags] = await Promise.all([getLatestRelease(), getTags()])
    const version = latest.tag_name

    const versionByAlias = Object.fromEntries(tags.map((tag) => [tag.commit.sha, tag.name]))
    const aliasByVersion = new Map(tags.map((tag) => [tag.name, tag.commit.sha]))

    // Fall back to /commits/{tag} only when the latest release isn't in the
    // first 100 tags (rare — /tags is ordered newest-first).
    const aliasFromTags = aliasByVersion.get(latest.tag_name)
    const alias =
      aliasFromTags === undefined ? (await getCommit(latest.tag_name)).sha : aliasFromTags

    return {
      name,
      version,
      versions: [version],
      alias,
      versionByAlias,
      format: 'github-actions-workflow',
    }
  }
}
